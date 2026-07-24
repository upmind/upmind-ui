#!/usr/bin/env python3
"""
graphify-postprocess.py — corrects graphify edges for the Upmind monorepo.

graphify's AST extractor has three failures that drop cross-package edges:
  1. TS path aliases like `@upmind-automation/headless` get collapsed to bare
     `headless` (no such node exists -> edge dropped).
  2. Relative imports `../system` get concatenated into the file's own
     directory path (wrong target -> edge dropped).
  3. Vue files: <script>/<script setup> imports aren't always parsed.

This script:
  - Reads graphify-out/.graphify_ast.json (raw AST output, run resolver right
    after AST extraction and before graph build).
  - Walks every source file under packages/* and apps/*, extracting <script>
    blocks for .vue files and applying a strict TS import regex.
  - Resolves each import via:
      * @upmind-automation/X package aliases (from tsconfig.json paths)
      * @/ aliases (package-internal)
      * Relative paths (./foo, ../bar) with proper extension/index resolution
  - For barrel imports (`{ useBasket } from '@upmind-automation/headless'`),
    resolves each named binding via a symbol index built by walking exports.
  - Replaces all `imports_from` edges with these resolved ones (keeps
    `contains` and other edges).
  - Drops INFERRED cross-package edges produced by the semantic extractor
    (those were filling the gap the AST left; we now have real edges).
  - Writes graphify-out/.graphify_ast_resolved.json.

Run from monorepo root:
  python3 .claude/scripts/graphify/resolver.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import subprocess as _sp
ROOT = Path(_sp.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())

# -----------------------------------------------------------------------------
# Config: tsconfig path aliases

PACKAGE_ALIASES = {
    "@upmind-automation/types": "packages/types/src/index.ts",
    "@upmind-automation/i18n": "packages/i18n/src/index.ts",
    "@upmind-automation/headless": "packages/headless/src/index.ts",
    "@upmind-automation/upmind-ui": "packages/ui/src/index.ts",
    "@upmind-automation/client-vue": "packages/client-vue/src/index.ts",
    "@upmind-automation/icons": "packages/icons/src/index.ts",
}

# `@/` resolves to each package/app's source root.
PACKAGE_AT_ROOTS = {
    "packages/headless": "packages/headless/src",
    "packages/ui": "packages/ui/src",
    "packages/client-vue": "packages/client-vue/src",
    "packages/types": "packages/types/src",
    "packages/i18n": "packages/i18n/src",
    "packages/icons": "packages/icons/src",
    "apps/cart": "apps/cart/src",
    "apps/cart-nuxt": "apps/cart-nuxt/app",
    "apps/hosting": "apps/hosting/src",
    "apps/velia": "apps/velia/src",
}

# Map alias -> package root (for symbol index lookup)
ALIAS_TO_PACKAGE = {
    "@upmind-automation/types": "packages/types",
    "@upmind-automation/i18n": "packages/i18n",
    "@upmind-automation/headless": "packages/headless",
    "@upmind-automation/upmind-ui": "packages/ui",
    "@upmind-automation/client-vue": "packages/client-vue",
    "@upmind-automation/icons": "packages/icons",
}

EXTENSIONS = [".ts", ".tsx", ".vue", ".js", ".jsx", ".mjs"]

# -----------------------------------------------------------------------------
# Regex patterns

# Strict import statement. Captures the binding clause so we know what was imported.
IMPORT_RE = re.compile(
    r"^\s*import\s+"
    r"(?:type\s+)?"
    r"(?P<bindings>"
    r"\{[^}]*\}"
    r"(?:\s*,\s*[A-Za-z_$][\w$]*)?"
    r"|[A-Za-z_$][\w$]*"
    r"(?:\s*,\s*\{[^}]*\})?"
    r"|\*\s+as\s+[A-Za-z_$][\w$]*"
    r")"
    r"\s+from\s+['\"]"
    r"(?P<path>[^'\"]+)"
    r"['\"]",
    re.MULTILINE,
)

# Side-effect imports: `import "./foo"`
SIDE_IMPORT_RE = re.compile(
    r"""^\s*import\s+['"](?P<path>[^'"]+)['"]\s*;?\s*$""",
    re.MULTILINE,
)

# Dynamic imports: `import("...")` (not `import.meta.glob` etc.)
DYNAMIC_IMPORT_RE = re.compile(r"""import\s*\(\s*['"]([^'"]+)['"]\s*\)""")

# Vue <script> and <script setup> blocks
SCRIPT_RE = re.compile(r"<script[^>]*>(.*?)</script>", re.DOTALL)

# Export declarations - for building the symbol index
EXPORT_DECL_RE = re.compile(
    r"""^\s*export\s+"""
    r"""(?:async\s+)?"""
    r"""(?:default\s+)?"""
    r"""(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class)"""
    r"""\s+(?P<name>[A-Za-z_$][\w$]*)""",
    re.MULTILINE,
)
EXPORT_NAMED_RE = re.compile(
    r"""^\s*export\s+\{(?P<names>[^}]+)\}""",
    re.MULTILINE,
)
EXPORT_DEFAULT_RE = re.compile(
    r"""^\s*export\s+default\s+(?:function\*?\s+)?(?P<name>[A-Za-z_$][\w$]*)""",
    re.MULTILINE,
)


# -----------------------------------------------------------------------------
# Helpers

def extract_script_body(text: str, suffix: str) -> str:
    """For .vue files, return concatenated <script> bodies. For others, full text."""
    if suffix != ".vue":
        return text
    blocks = SCRIPT_RE.findall(text)
    return "\n".join(blocks) if blocks else ""


def find_package(file_path: Path) -> str | None:
    """Return the package/app root (e.g. 'packages/headless') a file belongs to."""
    try:
        rel = file_path.relative_to(ROOT) if file_path.is_absolute() else file_path
    except ValueError:
        return None
    parts = rel.parts
    if len(parts) >= 2:
        candidate = f"{parts[0]}/{parts[1]}"
        if candidate in PACKAGE_AT_ROOTS:
            return candidate
    return None


def resolve_file(candidate: Path) -> Path | None:
    """Resolve a path-without-extension to an actual file.

    Tries candidate as-is, then candidate + each extension,
    then candidate/index.{ext}.
    """
    if candidate.is_file():
        return candidate
    # Try candidate + extension
    for ext in EXTENSIONS:
        with_ext = candidate.parent / (candidate.name + ext)
        if with_ext.is_file():
            return with_ext
    # Try candidate as directory with /index.ext
    if candidate.is_dir():
        for ext in EXTENSIONS:
            idx = candidate / f"index{ext}"
            if idx.is_file():
                return idx
    return None


def extract_binding_names(bindings: str) -> tuple[list[str], bool]:
    """Pull all identifier names from an import binding clause.

    Returns (names, is_namespace_import).
    Namespace imports `* as X` don't reveal which specific symbols are used,
    so we can't resolve them to specific files.
    """
    if "*" in bindings and "as" in bindings:
        return [], True
    names: list[str] = []
    brace = re.search(r"\{([^}]*)\}", bindings)
    if brace:
        for item in brace.group(1).split(","):
            item = item.strip()
            if not item:
                continue
            # `foo as bar` -> use `foo` (the original export name)
            original = re.split(r"\s+as\s+", item)[0].strip()
            original = re.sub(r"^type\s+", "", original)
            if original:
                names.append(original)
    # Default import outside the braces
    outside = re.sub(r"\{[^}]*\}", "", bindings).strip().rstrip(",").strip()
    for tok in outside.split(","):
        tok = tok.strip()
        if not tok or tok.startswith("*"):
            continue
        names.append(tok)
    return names, False


# -----------------------------------------------------------------------------
# Symbol index: maps {package -> {export_name -> source_file_path}}

def build_symbol_index() -> dict[str, dict[str, str]]:
    """Walk every TS/Vue source file under packages/* and apps/* and record
    the source file for each top-level export.

    Returns: {package_root: {symbol_name: source_file_relative_to_root}}
    """
    index: dict[str, dict[str, str]] = defaultdict(dict)

    for pkg in PACKAGE_AT_ROOTS:
        src_root = ROOT / PACKAGE_AT_ROOTS[pkg]
        if not src_root.exists():
            continue
        for f in src_root.rglob("*"):
            if not f.is_file() or f.suffix not in EXTENSIONS:
                continue
            if "node_modules" in f.parts or "dist" in f.parts:
                continue
            if any(p in f.name for p in (".spec.", ".test.", ".no-test.", ".stories.")):
                continue
            try:
                text = f.read_text(errors="ignore")
            except Exception:
                continue
            body = extract_script_body(text, f.suffix)

            rel = str(f.relative_to(ROOT))

            for m in EXPORT_DECL_RE.finditer(body):
                name = m.group("name")
                index[pkg].setdefault(name, rel)
            for m in EXPORT_DEFAULT_RE.finditer(body):
                name = m.group("name")
                # Default export still uses its declared name as the symbol
                index[pkg].setdefault(name, rel)
            for m in EXPORT_NAMED_RE.finditer(body):
                for item in m.group("names").split(","):
                    item = item.strip()
                    if not item:
                        continue
                    # `{ foo as bar }` exports `bar`; the consumer imports `bar`
                    parts = re.split(r"\s+as\s+", item)
                    exported_name = parts[-1].strip()
                    exported_name = re.sub(r"^type\s+", "", exported_name)
                    if exported_name:
                        index[pkg].setdefault(exported_name, rel)

    return dict(index)


# -----------------------------------------------------------------------------
# Import resolution

def resolve_import(
    import_str: str,
    source_file: Path,
    symbol_names: list[str],
    is_namespace_import: bool,
    symbol_index: dict[str, dict[str, str]],
) -> list[Path]:
    """Resolve an import specifier to one or more concrete file paths.

    For barrel imports with named bindings, attempts to resolve each binding
    to its actual source file via the symbol index. Returns multiple paths
    when an import pulls names from different files.
    """
    # Cross-package alias (exact match, e.g. `@upmind-automation/headless`)
    if import_str in PACKAGE_ALIASES:
        pkg = ALIAS_TO_PACKAGE.get(import_str)
        if pkg and symbol_names and not is_namespace_import:
            resolved = []
            unresolved_names = []
            for name in symbol_names:
                src = symbol_index.get(pkg, {}).get(name)
                if src:
                    p = ROOT / src
                    if p.exists():
                        resolved.append(p)
                else:
                    unresolved_names.append(name)
            if resolved:
                # If some names couldn't be resolved, also link to the barrel
                if unresolved_names:
                    barrel = resolve_file(ROOT / PACKAGE_ALIASES[import_str])
                    if barrel:
                        resolved.append(barrel)
                return resolved
        # Namespace import or unresolved names -> link to the barrel
        barrel = resolve_file(ROOT / PACKAGE_ALIASES[import_str])
        return [barrel] if barrel else []

    # Sub-path of a package alias, e.g. `@upmind-automation/types/oauth`
    for alias, barrel_path in PACKAGE_ALIASES.items():
        if import_str.startswith(alias + "/"):
            sub = import_str[len(alias) + 1:]
            base = (ROOT / barrel_path).parent
            target = resolve_file(base / sub)
            return [target] if target else []

    # `@/` alias -> package's src/ root
    if import_str.startswith("@/"):
        pkg = find_package(source_file)
        if pkg:
            base = ROOT / PACKAGE_AT_ROOTS[pkg]
            target = resolve_file(base / import_str[2:])
            return [target] if target else []
        return []

    # Relative import
    if import_str.startswith("."):
        try:
            target = (source_file.parent / import_str).resolve(strict=False)
        except Exception:
            return []
        resolved = resolve_file(target)
        return [resolved] if resolved else []

    # Bare module specifier (vue, xstate, lodash-es, etc.) -> external
    return []


# -----------------------------------------------------------------------------
# Edge generation

def parse_edges(
    file_node: dict[str, str],
    symbol_index: dict[str, dict[str, str]],
) -> tuple[list[dict], dict[str, int]]:
    """Walk all source files, parse imports, emit resolved edges.

    Returns (edges, stats).
    """
    edges: list[dict] = []
    stats = defaultdict(int)
    cross_pkg: dict[tuple[str, str], int] = defaultdict(int)

    for sf, source_nid in file_node.items():
        path = ROOT / sf
        if not path.exists() or not path.is_file():
            continue
        try:
            text = path.read_text(errors="ignore")
        except Exception:
            continue
        body = extract_script_body(text, path.suffix)
        if not body:
            stats["files_skipped_no_script"] += 1
            continue

        src_pkg = find_package(path)

        # Standard import statements (with bindings)
        for m in IMPORT_RE.finditer(body):
            bindings = m.group("bindings")
            spec = m.group("path")
            names, is_ns = extract_binding_names(bindings)
            targets = resolve_import(spec, path, names, is_ns, symbol_index)

            if not targets:
                if spec.startswith(".") or spec.startswith("@/") or spec.startswith("@upmind-automation/"):
                    stats["unresolved"] += 1
                else:
                    stats["external"] += 1
                continue

            for tp in targets:
                try:
                    target_rel = str(tp.relative_to(ROOT))
                except ValueError:
                    stats["unresolved"] += 1
                    continue
                target_nid = file_node.get(target_rel)
                if not target_nid:
                    stats["resolved_but_no_node"] += 1
                    continue
                if target_nid == source_nid:
                    continue
                edges.append({
                    "source": source_nid,
                    "target": target_nid,
                    "relation": "imports_from",
                    "confidence": "EXTRACTED",
                    "confidence_score": 1.0,
                    "source_file": sf,
                    "weight": 1.0,
                })
                stats["resolved"] += 1
                tgt_pkg = find_package(tp)
                if src_pkg and tgt_pkg and src_pkg != tgt_pkg:
                    cross_pkg[(src_pkg, tgt_pkg)] += 1

        # Side-effect and dynamic imports (no bindings)
        for pattern in (SIDE_IMPORT_RE, DYNAMIC_IMPORT_RE):
            for m in pattern.finditer(body):
                spec = m.group(1) if pattern is DYNAMIC_IMPORT_RE else m.group("path")
                targets = resolve_import(spec, path, [], False, symbol_index)
                for tp in targets:
                    try:
                        target_rel = str(tp.relative_to(ROOT))
                    except ValueError:
                        continue
                    target_nid = file_node.get(target_rel)
                    if not target_nid or target_nid == source_nid:
                        continue
                    edges.append({
                        "source": source_nid,
                        "target": target_nid,
                        "relation": "imports_from",
                        "confidence": "EXTRACTED",
                        "confidence_score": 1.0,
                        "source_file": sf,
                        "weight": 1.0,
                    })
                    stats["resolved"] += 1

    stats["cross_pkg_pairs"] = len(cross_pkg)
    # Stash the pair counts for the report
    stats["_cross_pkg"] = cross_pkg
    return edges, stats


# -----------------------------------------------------------------------------
# Main

def main() -> int:
    ast_path = ROOT / "graphify-out/.graphify_ast.json"
    if not ast_path.exists():
        print(f"ERROR: {ast_path} not found. Re-run AST extraction first.", file=sys.stderr)
        return 1

    print("Loading AST output...")
    ast = json.loads(ast_path.read_text())
    nodes = ast["nodes"]
    edges = ast["edges"]

    # Index file-level nodes by source_file. Prefer entries whose label ends in an extension.
    file_node: dict[str, str] = {}
    for n in nodes:
        sf = n.get("source_file")
        if not sf:
            continue
        label = n.get("label", "")
        is_file_label = any(label.endswith(ext) for ext in EXTENSIONS)
        if is_file_label or sf not in file_node:
            if sf not in file_node or is_file_label:
                file_node[sf] = n["id"]
    print(f"  {len(file_node)} file-level nodes indexed")

    # Preserve non-import edges
    preserved = [e for e in edges if e.get("relation") != "imports_from"]
    dropped = len(edges) - len(preserved)
    print(f"  Dropping {dropped} broken `imports_from` edges from AST")
    print(f"  Preserving {len(preserved)} other edges (contains, references, etc.)")

    print()
    print("Building symbol index from package exports...")
    symbol_index = build_symbol_index()
    for pkg, syms in symbol_index.items():
        print(f"  {pkg}: {len(syms)} exports")

    print()
    print("Parsing imports across all source files...")
    new_edges, stats = parse_edges(file_node, symbol_index)
    print(f"  Resolved: {stats['resolved']} edges")
    print(f"  External (skipped): {stats['external']}")
    print(f"  Unresolved (path didn't match): {stats['unresolved']}")
    print(f"  Resolved but target had no node: {stats['resolved_but_no_node']}")
    print(f"  Vue files with no <script>: {stats.get('files_skipped_no_script', 0)}")

    print()
    print("Top cross-package edge counts:")
    cross_pkg = stats.get("_cross_pkg", {})
    for (s, t), n in sorted(cross_pkg.items(), key=lambda x: -x[1])[:20]:
        print(f"  {s:25s} -> {t:25s}  {n} edges")

    # Drop INFERRED cross-package edges from semantic extraction (we have real ones now).
    def edge_packages(e):
        src_n = next((n for n in nodes if n["id"] == e["source"]), None)
        tgt_n = next((n for n in nodes if n["id"] == e["target"]), None)
        if not src_n or not tgt_n:
            return None, None
        src_pkg = find_package(Path(src_n.get("source_file", "")))
        tgt_pkg = find_package(Path(tgt_n.get("source_file", "")))
        return src_pkg, tgt_pkg

    # Build node lookup for speed
    node_lookup = {n["id"]: n for n in nodes}

    inferred_dropped = 0
    cleaned_preserved = []
    for e in preserved:
        if e.get("confidence") == "INFERRED":
            src_n = node_lookup.get(e["source"])
            tgt_n = node_lookup.get(e["target"])
            if src_n and tgt_n:
                src_pkg = find_package(Path(src_n.get("source_file", "")))
                tgt_pkg = find_package(Path(tgt_n.get("source_file", "")))
                if src_pkg and tgt_pkg and src_pkg != tgt_pkg:
                    inferred_dropped += 1
                    continue
        cleaned_preserved.append(e)
    print()
    print(f"Dropped {inferred_dropped} INFERRED cross-package edges (now superseded by EXTRACTED)")

    # Write resolved AST
    final = {
        "nodes": nodes,
        "edges": cleaned_preserved + new_edges,
        "hyperedges": ast.get("hyperedges", []),
        "input_tokens": 0,
        "output_tokens": 0,
    }
    out = ROOT / "graphify-out/.graphify_ast_resolved.json"
    out.write_text(json.dumps(final, indent=2))
    print()
    print(f"Wrote {out}")
    print(f"  {len(final['nodes'])} nodes, {len(final['edges'])} edges total")
    print(f"  ({len(cleaned_preserved)} preserved + {len(new_edges)} newly resolved)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
