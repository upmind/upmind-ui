#!/usr/bin/env python3
"""
resolver.py — fix the import edges graphify's AST extractor drops.

GENERIC and zero-config: reads the repo's own tsconfig `paths` at runtime
(so it adapts to whatever each repo declares — `@agentic-tutor/*` in one,
`@upmind-automation/*` in another) and resolves three classes of import the
AST extractor mangles or misses:

  1. Relative imports — especially the ESM/NodeNext convention where a `.js`
     specifier points at a `.ts` source (`import x from "./foo.js"` → foo.ts).
     This is the single biggest edge-dropper for modern TS backends.
  2. TS path-alias / barrel imports — `{ Foo } from "@pkg"` collapses to a bare
     name and the edge is dropped. We build a symbol index over each aliased
     package's exports and resolve every named binding to its real source file.
  3. Vue `.vue` files — graphify doesn't reliably parse `<script>` / `<script
     setup>` blocks, so component imports vanish. We extract the script bodies
     and, because Vue components are referenced in PascalCase but their files
     and kebab forms differ, the symbol index registers both casings.

Pipeline position: run AFTER AST extraction, BEFORE graph build. Reads
graphify-out/.graphify_ast.json, writes .graphify_ast_resolved.json with the
broken `imports_from` edges replaced by correctly-resolved ones.

Run from the repo root:
  python3 .claude/.shared/scripts/graphify/resolver.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

# ROOT is the graph's scope root. Default = git toplevel (whole repo); a
# package-scoped build (refresh.sh --scope <dir>) exports GRAPHIFY_ROOT=<dir>
# so every path (AST location, tsconfig discovery, edge keys) is scoped to it.
_env_root = os.environ.get("GRAPHIFY_ROOT")
ROOT = Path(_env_root).resolve() if _env_root else Path(
    subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())

EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".vue", ".js", ".jsx", ".mjs", ".cjs"]
# ESM specifiers ending in these are rewritten to their TS source on resolve.
JS_TO_TS = {".js": ".ts", ".mjs": ".mts", ".cjs": ".cts", ".jsx": ".tsx"}
SKIP_NAME = (".spec.", ".test.", ".stories.", ".no-test.", ".d.ts")

IMPORT_RE = re.compile(
    r"^\s*import\s+(?:type\s+)?"
    r"(?P<bindings>\{[^}]*\}(?:\s*,\s*[A-Za-z_$][\w$]*)?"
    r"|[A-Za-z_$][\w$]*(?:\s*,\s*\{[^}]*\})?"
    r"|\*\s+as\s+[A-Za-z_$][\w$]*)"
    r"\s+from\s+['\"](?P<path>[^'\"]+)['\"]",
    re.MULTILINE,
)
SIDE_IMPORT_RE = re.compile(r"""^\s*import\s+['"](?P<path>[^'"]+)['"]\s*;?\s*$""", re.MULTILINE)
DYNAMIC_IMPORT_RE = re.compile(r"""import\s*\(\s*['"]([^'"]+)['"]\s*\)""")
EXPORT_FROM_RE = re.compile(
    r"""^\s*export\s+(?:type\s+)?(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?)\s+from\s+['"](?P<path>[^'"]+)['"]""",
    re.MULTILINE,
)
# Vue <script> and <script setup> blocks.
SCRIPT_RE = re.compile(r"<script[^>]*>(.*?)</script>", re.DOTALL)

EXPORT_DECL_RE = re.compile(
    r"""^\s*export\s+(?:async\s+)?(?:default\s+)?"""
    r"""(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class)"""
    r"""\s+(?P<name>[A-Za-z_$][\w$]*)""",
    re.MULTILINE,
)
EXPORT_NAMED_RE = re.compile(r"""^\s*export\s+(?:type\s+)?\{(?P<names>[^}]+)\}""", re.MULTILINE)
EXPORT_DEFAULT_RE = re.compile(r"""^\s*export\s+default\s+(?:function\*?\s+)?(?P<name>[A-Za-z_$][\w$]*)""", re.MULTILINE)


def kebab(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()


# ----------------------------------------------------------------------------- config (generic)

def strip_jsonc(text: str) -> str:
    """Strip // and /* */ comments — but string-aware, so `/*` and `*/` that
    appear *inside* path strings (e.g. "@scope/*": ["./packages/*/src"]) are
    left untouched."""
    out: list[str] = []
    i, n, in_str = 0, len(text), False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1]); i += 2; continue
            if c == '"':
                in_str = False
            i += 1; continue
        if c == '"':
            in_str = True; out.append(c); i += 1; continue
        if c == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if c == "/" and i + 1 < n and text[i + 1] == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2; continue
        out.append(c); i += 1
    return re.sub(r",(\s*[}\]])", r"\1", "".join(out))  # trailing commas


def load_aliases() -> list[tuple[str, list[str]]]:
    """Discover every tsconfig `paths` mapping in the repo. Returns a list of
    (pattern, [target_templates]); targets are repo-root-relative."""
    aliases: list[tuple[str, list[str]]] = []
    seen: set[str] = set()
    for cfg in ROOT.rglob("tsconfig*.json"):
        if "node_modules" in cfg.parts:
            continue
        try:
            data = json.loads(strip_jsonc(cfg.read_text(errors="ignore")))
        except Exception:
            continue
        for pattern, targets in ((data.get("compilerOptions") or {}).get("paths") or {}).items():
            if pattern in seen or not isinstance(targets, list):
                continue
            seen.add(pattern)
            aliases.append((pattern, [t[2:] if t.startswith("./") else t for t in targets]))
    return aliases


def package_src_roots(aliases) -> list[Path]:
    """Real source roots an alias points into (expanding `*` globs). Used to scope
    the symbol-index walk to package code rather than the whole repo."""
    roots: list[Path] = []
    for _, targets in aliases:
        for tmpl in targets:
            if "*" in tmpl:
                prefix = tmpl.split("*", 1)[0]
                tail = tmpl.split("*", 1)[1]
                for d in ROOT.glob(prefix + "*" + tail):
                    if d.is_dir():
                        roots.append(d)
            else:
                p = ROOT / tmpl
                if p.is_dir():
                    roots.append(p)
                elif p.parent.is_dir():
                    roots.append(p.parent)
    # de-dupe, keep order
    out, seen = [], set()
    for r in roots:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def _tsconfig_dirs(pkgdir: Path) -> tuple[str | None, str | None]:
    """(rootDir, outDir) from a package's own tsconfig.json, following `extends`.

    Read rather than assumed: a Nuxt app roots at `app/`, a library at `src/`,
    and a package with `rootDir: "."` roots at itself. Guessing `src/` silently
    drops every edge into the packages that do not use it.
    """
    seen: set[Path] = set()
    cfg = pkgdir / "tsconfig.json"
    root_dir = out_dir = None
    while cfg.is_file() and cfg not in seen:
        seen.add(cfg)
        try:
            data = json.loads(strip_jsonc(cfg.read_text(errors="ignore")))
        except Exception:
            break
        co = data.get("compilerOptions") or {}
        root_dir = root_dir or co.get("rootDir")
        out_dir = out_dir or co.get("outDir")
        if root_dir and out_dir:
            break
        ext = data.get("extends")
        if not isinstance(ext, str):
            break
        cfg = (cfg.parent / ext).resolve()
    return root_dir, out_dir


def package_src_root(pkgdir: Path) -> Path:
    """The directory a package's source actually lives in."""
    root_dir, _ = _tsconfig_dirs(pkgdir)
    if root_dir:
        candidate = (pkgdir / root_dir).resolve()
        if candidate.is_dir():
            return candidate
    for conventional in ("src", "app"):
        if (pkgdir / conventional).is_dir():
            return pkgdir / conventional
    return pkgdir


def _desugar_build_subpath(subpath: str, pkgdir: Path) -> str | None:
    """Rewrite a subpath that points into build output back onto source.

    `@scope/pkg/dist/worktree.js` is a real import in this repo. `dist/` is
    excluded from the graph, so the edge dies unless outDir is swapped for
    rootDir and the emitted extension is swapped for its TS source.
    """
    root_dir, out_dir = _tsconfig_dirs(pkgdir)
    if not out_dir:
        return None
    out_rel = out_dir.lstrip("./").rstrip("/")
    if not out_rel or not (subpath == out_rel or subpath.startswith(out_rel + "/")):
        return None
    tail = subpath[len(out_rel):].lstrip("/")
    for emitted, source in JS_TO_TS.items():
        if tail.endswith(emitted):
            tail = tail[: -len(emitted)] + source
            break
    return tail or None


def load_workspace_packages() -> list[tuple[str, Path, Path]]:
    """Map every workspace package's package.json `name` → (name, pkg dir, src root).

    Modern pnpm/npm monorepos import sibling packages by their published name
    (`@scope/pkg`) resolved via workspace symlinks — NOT via tsconfig `paths`.
    graphify's AST extractor drops these (bare specifier → external), so without
    this the whole monorepo graph has zero cross-package edges. Generic: reads
    pnpm-workspace.yaml globs (falls back to apps/*, packages/*) and each
    package.json name — no hardcoded scope."""
    globs: list[str] = []
    ws = ROOT / "pnpm-workspace.yaml"
    if ws.is_file():
        in_pkgs = False
        for line in ws.read_text(errors="ignore").splitlines():
            if re.match(r"^\s*packages\s*:", line):
                in_pkgs = True
                continue
            if in_pkgs:
                m = re.match(r"""^\s*-\s*['"]?([^'"#\s]+)['"]?""", line)
                if m:
                    globs.append(m.group(1))
                elif line.strip() and not line.startswith((" ", "\t")):
                    break  # next top-level key
    if not globs:
        globs = ["apps/*", "packages/*"]

    seen_dir: set[Path] = set()
    out: list[tuple[str, Path, Path]] = []
    for g in globs:
        if g.startswith("!"):
            continue
        for d in ROOT.glob(g):
            if not d.is_dir() or d in seen_dir:
                continue
            pj = d / "package.json"
            if not pj.is_file():
                continue
            try:
                name = json.loads(pj.read_text(errors="ignore")).get("name")
            except Exception:
                name = None
            if not name:
                continue
            seen_dir.add(d)
            out.append((name, d, package_src_root(d)))
    return out


# ----------------------------------------------------------------------------- file resolution

def extract_body(path: Path, text: str) -> str:
    if path.suffix != ".vue":
        return text
    return "\n".join(SCRIPT_RE.findall(text))


def resolve_file(candidate: Path) -> Path | None:
    if candidate.is_file():
        return candidate
    # ESM: "./foo.js" but the source is foo.ts.
    if candidate.suffix in JS_TO_TS:
        stem = candidate.with_suffix("")
        for ext in (JS_TO_TS[candidate.suffix], ".ts", ".tsx", ".mts", ".cts", ".vue"):
            p = stem.parent / (stem.name + ext)
            if p.is_file():
                return p
    for ext in EXTENSIONS:
        p = candidate.parent / (candidate.name + ext)
        if p.is_file():
            return p
    if candidate.is_dir():
        for ext in EXTENSIONS:
            idx = candidate / f"index{ext}"
            if idx.is_file():
                return idx
    return None


# ----------------------------------------------------------------------------- symbol index (barrel + Vue)

def extract_binding_names(bindings: str) -> tuple[list[str], bool]:
    """Identifiers from an import clause. (names, is_namespace_import)."""
    if "*" in bindings and " as " in bindings:
        return [], True
    names: list[str] = []
    brace = re.search(r"\{([^}]*)\}", bindings)
    if brace:
        for item in brace.group(1).split(","):
            item = item.strip()
            if not item:
                continue
            original = re.sub(r"^type\s+", "", re.split(r"\s+as\s+", item)[0].strip())
            if original:
                names.append(original)
    outside = re.sub(r"\{[^}]*\}", "", bindings).strip().strip(",").strip()
    for tok in outside.split(","):
        tok = tok.strip()
        if tok and not tok.startswith("*"):
            names.append(tok)
    return names, False


def build_symbol_index(roots: list[Path]) -> dict[Path, dict[str, str]]:
    """For each package src root, map every exported symbol → its source file
    (repo-relative). Vue components are registered under both PascalCase and
    kebab-case so either import style resolves."""
    index: dict[Path, dict[str, str]] = defaultdict(dict)
    for root in roots:
        for f in root.rglob("*"):
            if not f.is_file() or f.suffix not in EXTENSIONS:
                continue
            if "node_modules" in f.parts or "dist" in f.parts or any(s in f.name for s in SKIP_NAME):
                continue
            try:
                body = extract_body(f, f.read_text(errors="ignore"))
            except Exception:
                continue
            rel = str(f.relative_to(ROOT))
            names: set[str] = set()
            for m in EXPORT_DECL_RE.finditer(body):
                names.add(m.group("name"))
            for m in EXPORT_DEFAULT_RE.finditer(body):
                names.add(m.group("name"))
            for m in EXPORT_NAMED_RE.finditer(body):
                for item in m.group("names").split(","):
                    item = item.strip()
                    if item:
                        names.add(re.sub(r"^type\s+", "", re.split(r"\s+as\s+", item)[-1].strip()))
            # A .vue file IS a component export under its PascalCase stem.
            if f.suffix == ".vue" and f.stem[:1].isupper():
                names.add(f.stem)
            for name in names:
                index[root].setdefault(name, rel)
                if name[:1].isupper():  # register kebab form for Vue components
                    index[root].setdefault(kebab(name), rel)
    return dict(index)


# ----------------------------------------------------------------------------- import resolution

def owning_root(path: Path, roots: list[Path]) -> Path | None:
    for r in roots:
        try:
            path.relative_to(r)
            return r
        except ValueError:
            continue
    return None


def resolve_alias(spec: str, source: Path, names: list[str], is_ns: bool,
                  aliases, roots, index) -> list[Path]:
    """Resolve an aliased specifier to one or more files. For barrel imports we
    resolve each named binding via the symbol index; otherwise the barrel file."""
    for pattern, targets in aliases:
        captured = None
        if "*" in pattern:
            prefix, _, suffix = pattern.partition("*")
            if not (spec.startswith(prefix) and spec.endswith(suffix)
                    and len(spec) >= len(prefix) + len(suffix)):
                continue
            captured = spec[len(prefix): len(spec) - len(suffix) if suffix else None]
        elif spec != pattern:
            continue

        for tmpl in targets:
            target_str = tmpl.replace("*", captured) if captured is not None else tmpl
            base = ROOT / target_str
            # `@/` style — relative to the importing file's own package root.
            if pattern.startswith("@/") and (r := owning_root(source, roots)):
                base = r / (captured or "")
            # Barrel: resolve each named binding to its file via the symbol index.
            if names and not is_ns:
                root_key = next((r for r in roots if str(base).startswith(str(r))), None) \
                    or (base if base.is_dir() else base.parent)
                resolved, missing = [], False
                for nm in names:
                    src = index.get(root_key, {}).get(nm)
                    if src and (ROOT / src).exists():
                        resolved.append(ROOT / src)
                    else:
                        missing = True
                if resolved:
                    if missing and (barrel := resolve_file(base)):
                        resolved.append(barrel)
                    return resolved
            if (r := resolve_file(base)):
                return [r]
    return []


def resolve_index(directory: Path) -> Path | None:
    for ext in EXTENSIONS:
        idx = directory / f"index{ext}"
        if idx.is_file():
            return idx
    return None


def resolve_workspace(spec, names, is_ns, ws_packages, index) -> list[Path]:
    """Resolve a workspace-package import (`@scope/pkg` or `@scope/pkg/subpath`)
    to real source files. Barrel imports resolve each named binding via the
    symbol index over the package's src root; subpaths resolve directly; anything
    unresolved falls back to the package's index (still a real cross-package edge)."""
    for name, pkgdir, src_root in ws_packages:
        if spec == name:
            subpath = ""
        elif spec.startswith(name + "/"):
            subpath = spec[len(name) + 1:]
        else:
            continue
        if subpath:
            candidates = [src_root / subpath, pkgdir / subpath]
            if (desugared := _desugar_build_subpath(subpath, pkgdir)):
                candidates.insert(0, src_root / desugared)
            for base in candidates:
                if (r := resolve_file(base)):
                    return [r]
            return [b] if (b := resolve_index(src_root)) else []
        if names and not is_ns:
            resolved, missing = [], False
            for nm in names:
                src = index.get(src_root, {}).get(nm)
                if src and (ROOT / src).exists():
                    resolved.append(ROOT / src)
                else:
                    missing = True
            if resolved:
                if missing and (b := resolve_index(src_root)):
                    resolved.append(b)
                return resolved
        return [b] if (b := resolve_index(src_root)) else []
    return []


def resolve_spec(spec, source, names, is_ns, aliases, roots, index, ws_packages) -> list[Path]:
    if spec.startswith("."):
        try:
            r = resolve_file((source.parent / spec).resolve(strict=False))
            return [r] if r else []
        except Exception:
            return []
    # Workspace-package import (@scope/pkg) — resolved by package.json name.
    if (r := resolve_workspace(spec, names, is_ns, ws_packages, index)):
        return r
    if spec.startswith("@") or "/" in spec:
        return resolve_alias(spec, source, names, is_ns, aliases, roots, index)
    return []  # bare external module



def build_symbol_node_index(nodes: list[dict]) -> dict[tuple[str, str], str]:
    """(source_file, bare symbol name) -> node id, over the AST's symbol nodes.

    Needed because the file->file `imports_from` edge this resolver emits is
    invisible to a symbol query: `graphify query "who calls X()"` walks edges
    incident on the X() SYMBOL node. Without a file->symbol edge the resolved
    cross-package caller is in the graph and unreachable from the function.
    Labels carry a `()` suffix for callables, so match on the bare name.
    """
    idx: dict[tuple[str, str], str] = {}
    for n in nodes:
        sf, label = n.get("source_file"), (n.get("label") or "")
        if not sf or not label or label.endswith(tuple(EXTENSIONS)):
            continue
        bare = label[:-2] if label.endswith("()") else label
        idx.setdefault((sf, bare), n["id"])
    return idx


# ----------------------------------------------------------------------------- main

def main() -> int:
    ast_path = ROOT / "graphify-out/.graphify_ast.json"
    if not ast_path.exists():
        print(f"resolver: {ast_path} not found — run AST extraction first", file=sys.stderr)
        return 1

    ast = json.loads(ast_path.read_text())
    nodes, edges = ast["nodes"], ast["edges"]

    file_node: dict[str, str] = {}
    for n in nodes:
        sf = n.get("source_file")
        if not sf:
            continue
        is_file = any((n.get("label", "") or "").endswith(e) for e in EXTENSIONS)
        if sf not in file_node or is_file:
            file_node[sf] = n["id"]

    aliases = load_aliases()
    ws_packages = load_workspace_packages()
    roots = package_src_roots(aliases)
    # The symbol index must also cover workspace package src roots so bare
    # `@scope/pkg` barrel imports resolve to the real exporting files.
    index_roots = roots + [sr for _, _, sr in ws_packages if sr not in roots]
    index = build_symbol_index(index_roots) if index_roots else {}

    symbol_node = build_symbol_node_index(nodes)
    preserved = [e for e in edges if e.get("relation") != "imports_from"]
    dropped = len(edges) - len(preserved)

    new_edges: list[dict] = []
    stats = defaultdict(int)
    for sf, src_nid in file_node.items():
        path = ROOT / sf
        if not path.is_file():
            continue
        try:
            body = extract_body(path, path.read_text(errors="ignore"))
        except Exception:
            continue
        if not body:
            continue

        specs: list[tuple[str, list[str], bool]] = []
        for m in IMPORT_RE.finditer(body):
            nm, ns = extract_binding_names(m.group("bindings"))
            specs.append((m.group("path"), nm, ns))
        for m in SIDE_IMPORT_RE.finditer(body):
            specs.append((m.group("path"), [], False))
        for m in EXPORT_FROM_RE.finditer(body):
            specs.append((m.group("path"), [], False))
        for p in DYNAMIC_IMPORT_RE.findall(body):
            specs.append((p, [], False))

        for spec, names, is_ns in specs:
            targets = resolve_spec(spec, path, names, is_ns, aliases, roots, index, ws_packages)
            if not targets:
                stats["unresolved" if spec.startswith((".", "@")) else "external"] += 1
                continue
            for tp in targets:
                try:
                    tgt_sf = str(tp.relative_to(ROOT))
                except ValueError:
                    continue
                tgt_nid = file_node.get(tgt_sf)
                if not tgt_nid or tgt_nid == src_nid:
                    continue
                new_edges.append({
                    "source": src_nid, "target": tgt_nid, "relation": "imports_from",
                    "confidence": "EXTRACTED", "confidence_score": 1.0,
                    "source_file": sf, "weight": 1.0,
                })
                stats["resolved"] += 1
                # file -> SYMBOL edges: what makes the caller reachable from the
                # function node in a symbol query (see build_symbol_node_index).
                for nm in names:
                    sym_nid = symbol_node.get((tgt_sf, nm))
                    if sym_nid and sym_nid != src_nid:
                        new_edges.append({
                            "source": src_nid, "target": sym_nid, "relation": "imports",
                            "confidence": "EXTRACTED", "confidence_score": 1.0,
                            "source_file": sf, "context": "call", "weight": 1.0,
                        })
                        stats["symbol"] += 1

    seen_e: set[tuple[str, str]] = set()
    deduped = []
    for e in new_edges:
        k = (e["source"], e["target"], e["relation"])
        if k not in seen_e:
            seen_e.add(k)
            deduped.append(e)

    final = {
        "nodes": nodes, "edges": preserved + deduped,
        "hyperedges": ast.get("hyperedges", []), "input_tokens": 0, "output_tokens": 0,
    }
    (ROOT / "graphify-out/.graphify_ast_resolved.json").write_text(json.dumps(final, indent=2))

    print(f"  Resolved: {len(deduped)} import edges ({stats['symbol']} file->symbol) "
          f"(dropped {dropped} broken, {stats['unresolved']} unresolved, {stats['external']} external)")
    print(f"  tsconfig aliases: {[p for p, _ in aliases] or '(none)'}; "
          f"workspace packages: {[n for n, _, _ in ws_packages] or '(none)'}; "
          f"symbol index: {sum(len(v) for v in index.values())} exports across {len(index_roots)} package root(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
