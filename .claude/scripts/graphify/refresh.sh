#!/usr/bin/env bash
# refresh.sh — rebuild this monorepo's knowledge graph(s) (AST + resolver, no LLM cost).
#
# Two-tier, generic, zero-LLM pipeline:
#   • MONOREPO graph (root graphify-out/) — the union of every DERIVED workspace target.
#   • One PER-PACKAGE graph per target (<target>/graphify-out/) — each scoped to
#     that package via GRAPHIFY_ROOT (the resolver reads it; paths become
#     package-relative, exactly like a standalone repo). No module rollup per pkg.
#
# Steps, per graph:
#   1. Detect source files (excludes node_modules / build output / graphify-out)
#   2. AST extraction (free — no LLM)
#   3. Resolver post-process (fixes dropped relative/alias/Vue import edges — resolver.py,
#      generic: reads THIS repo's tsconfig paths at runtime)
#   4. Build + cluster + auto-label + report + graph.json + graph.html
#      (preserves cached semantic doc nodes from a prior /graphify run)
#   5. Module rollup (graph-modules.{json,html}) — MONOREPO graph only.
#
# Usage:
#   bash scripts/graphify/refresh.sh                # build monorepo + every per-package graph
#   bash scripts/graphify/refresh.sh --check        # quiet fast-exit if no source changed (hooks)
#   bash scripts/graphify/refresh.sh --scope <dir>  # build ONE package-scoped graph (used internally)
#
# Idempotent and safe to call from a git post-merge hook — never fails a git op.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Args ---
CHECK=false
SCOPE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK=true; shift ;;
    --scope) SCOPE="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done
log() { $CHECK || echo "$@"; }

# --- Targets: DERIVED, never hand-listed. ---
# Every workspace package that has a package.json is a target. The list comes
# from pnpm-workspace.yaml globs (falling back to apps/*, packages/*), exactly
# like resolver.py's load_workspace_packages(). A hand-maintained array is the
# "reports zero while dirty" failure mode: a new package silently never graphs.
# Opt a directory OUT with a .graphifyskip file in it.
derive_targets() {
  local root="$1" globs=() g d
  if [ -f "$root/pnpm-workspace.yaml" ]; then
    globs=($(awk '
      /^[[:space:]]*packages[[:space:]]*:/ { inpkg=1; next }
      inpkg && /^[[:space:]]*-/ { gsub(/^[[:space:]]*-[[:space:]]*/,""); gsub(/["\047]/,""); sub(/#.*/,""); gsub(/[[:space:]]/,""); if ($0 != "" && $0 !~ /^!/) print; next }
      inpkg && /^[^[:space:]-]/ { exit }
    ' "$root/pnpm-workspace.yaml"))
  fi
  [ ${#globs[@]} -eq 0 ] && globs=("apps/*" "packages/*")
  for g in "${globs[@]}"; do
    for d in $root/$g; do
      [ -d "$d" ] && [ -f "$d/package.json" ] && [ ! -f "$d/.graphifyskip" ] || continue
      # Submodules are ordinary packages — they are workspace code and they get
      # graphed. The only care needed is not dirtying a repo we do not own, so
      # graphify-out/ is added to the submodule's LOCAL .git/info/exclude below
      # (local-only: it never touches the submodule's tracked .gitignore).
      printf '%s\n' "${d#$root/}"
    done
  done | sort -u
}

# --- Resolve ROOT + mode ---
if [ -n "$SCOPE" ]; then
  ROOT="$(cd "$SCOPE" 2>/dev/null && pwd)" || exit 0
  SCOPED=true
  LABEL="$SCOPE"
else
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
  SCOPED=false
  LABEL="MONOREPO (refresh-graph)"
fi
cd "$ROOT" || exit 0
export GRAPHIFY_ROOT="$ROOT"     # resolver.py scopes every path to this
export GRAPHIFY_LABEL="$LABEL"   # step-4 cost.json label

TARGETS_REL=($(derive_targets "$ROOT"))

# Keep submodule worktrees clean without editing a repo we do not own:
# graphify-out/ goes in each submodule's LOCAL .git/info/exclude, which is not
# tracked by that repo. Idempotent; silent on any failure. Root pass only — a
# scoped (--scope) run derives an empty target set, and on macOS's bash 3.2
# `"${empty[@]}"` under `set -u` is a fatal unbound-variable error; the count
# guard keeps it safe there and the $SCOPED guard skips redundant work.
if ! $SCOPED && [ "${#TARGETS_REL[@]}" -gt 0 ]; then
  for _t in "${TARGETS_REL[@]}"; do
    _d="$ROOT/$_t"
    [ -e "$_d/.git" ] || continue
    git -C "$_d" check-ignore -q graphify-out 2>/dev/null && continue
    _ex="$(git -C "$_d" rev-parse --git-path info/exclude 2>/dev/null)" || continue
    [ -n "$_ex" ] || continue
    mkdir -p "$(dirname "$_ex")" 2>/dev/null || true
    grep -qxF 'graphify-out/' "$_ex" 2>/dev/null || echo 'graphify-out/' >> "$_ex"
  done
fi
$SCOPED || log "[refresh-graph] targets (derived): ${TARGETS_REL[*]:-none}"


# Run a heredoc'd python step from a REAL FILE, never stdin.
# graphify's parallel AST extractor uses multiprocessing `spawn` (the macOS
# default). spawn re-imports __main__ from its path; piping via `python -`
# makes that path `<stdin>`, which does not exist, so every worker dies with
# FileNotFoundError -> BrokenProcessPool -> the step exits 0 and the graph is
# silently never rebuilt. A real file gives __main__ a real path.
run_py() {
  local f rc
  f="$(mktemp "${TMPDIR:-/tmp}/graphify-step.XXXXXX")" || return 1
  mv "$f" "$f.py"; f="$f.py"
  cat > "$f"
  "$PYTHON" "$f" "$@"; rc=$?
  rm -f "$f"
  return $rc
}

OUT_DIR="$ROOT/graphify-out"
MARKER="$OUT_DIR/.refresh_marker"

# Per-package pass: build one scoped graph per target (monorepo run only).
# Defined before first use. Each child re-resolves ROOT/labels from --scope.
refresh_packages() {
  for t in "${TARGETS_REL[@]}"; do
    tdir="$ROOT/$t"
    [ -d "$tdir" ] && [ -n "$(ls -A "$tdir" 2>/dev/null)" ] || continue
    mkdir -p "$tdir/graphify-out"
    log "[refresh-graph] → per-package: $t"
    if $CHECK; then
      bash "$SCRIPT_DIR/refresh.sh" --scope "$tdir" --check
    else
      bash "$SCRIPT_DIR/refresh.sh" --scope "$tdir"
    fi
  done
}

# Opt-in: only build where a graphify-out/ exists (per-package dirs are created by
# refresh_packages below, so the whole tree stays opt-in-by-directory).
[ -d "$OUT_DIR" ] || exit 0

PYTHON="${PYTHON:-$(command -v python3 || true)}"
[ -z "$PYTHON" ] && { log "[refresh-graph] python3 not found — skipping"; exit 0; }

# Auto-install graphify if missing — don't break the dev's pull.
if ! "$PYTHON" -c "import graphify" 2>/dev/null; then
  log "[refresh-graph] installing graphify (one-time)..."
  "$PYTHON" -m pip install --quiet graphifyy 2>/dev/null \
    || "$PYTHON" -m pip install --quiet --break-system-packages graphifyy 2>/dev/null \
    || { log "[refresh-graph] could not install graphify — skipping"; exit 0; }
fi

# --- Scan set: scoped = whole package ("."); monorepo = existing targets ---
if $SCOPED; then
  SCAN=(".")
else
  SCAN=()
  for t in "${TARGETS_REL[@]}"; do
    if [ -d "$ROOT/$t" ] && [ -n "$(ls -A "$ROOT/$t" 2>/dev/null)" ]; then
      SCAN+=("$t")
    fi
  done
  [ ${#SCAN[@]} -eq 0 ] && { log "[refresh-graph] no targets present — skipping"; exit 0; }
fi

# --- Fast-exit: skip if no source file changed since the last refresh ---
if $CHECK && [ -f "$MARKER" ]; then
  LATEST=$(find "${SCAN[@]}" \
      \( -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.js" -o -name "*.mjs" \) \
      -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/lib/*" \
      -not -path "*/.nuxt/*" -not -path "*/.output/*" -not -path "*/.data/*" \
      -not -path "*/graphify-out/*" -not -path "*/.git/*" \
      -newer "$MARKER" -print -quit 2>/dev/null || true)
  [ -z "$LATEST" ] && exit 0
fi

log "[refresh-graph] rebuilding ${LABEL} (AST + resolver, no LLM)..."
mkdir -p "$OUT_DIR"
"$PYTHON" -c "import sys; open('$OUT_DIR/.graphify_python','w').write(sys.executable)"

# --- Step 1: Detect (over the scan set) ---
run_py "${SCAN[@]}" <<'PYEOF' || exit 0
import sys, json
from pathlib import Path
from graphify.detect import detect

EXCLUDE = ("node_modules", "/dist/", "/lib/", "/.nuxt/", "/.output/", "/.data/",
           "storybook-static", "graphify-out", "/.git/")
targets = sys.argv[1:]
files = {"code": [], "document": [], "paper": [], "image": [], "video": []}
total_words = 0
for t in targets:
    r = detect(Path(t))
    for cat, fs in r["files"].items():
        files.setdefault(cat, []).extend(str(f) for f in fs)
    total_words += r.get("total_words", 0)
files = {k: [f for f in v if not any(x in f for x in EXCLUDE)] for k, v in files.items()}
files["image"] = []
merged = {"files": files, "total_files": sum(len(v) for v in files.values()),
          "total_words": total_words, "needs_graph": True,
          "warning": None, "skipped_sensitive": []}
Path("graphify-out/.graphify_detect.json").write_text(json.dumps(merged))
print(f"  Step 1/5 detect: {merged['total_files']} files ({len(files['code'])} code, {len(files['document'])} docs)")
PYEOF

# --- Step 2: AST extraction ---
run_py <<'PYEOF' || exit 0
import json
from pathlib import Path
from graphify.extract import collect_files, extract

detect = json.loads(Path("graphify-out/.graphify_detect.json").read_text())
code_files = []
for f in detect["files"].get("code", []):
    p = Path(f)
    code_files.extend(collect_files(p) if p.is_dir() else [p])
result = extract(code_files)
Path("graphify-out/.graphify_ast.json").write_text(json.dumps(result, indent=2))
print(f"  Step 2/5 AST: {len(result['nodes'])} nodes, {len(result['edges'])} raw edges")
PYEOF

# --- Step 3: Resolver (fix dropped import edges; scoped via GRAPHIFY_ROOT) ---
log "  Step 3/5 resolve:"
if $CHECK; then
  "$PYTHON" "$SCRIPT_DIR/resolver.py" >/dev/null 2>&1 || true
else
  "$PYTHON" "$SCRIPT_DIR/resolver.py" 2>/dev/null || true
fi

# --- Step 4: Build + cluster + label + report + json + html ---
run_py <<'PYEOF' || exit 0
import os, sys, json
from collections import Counter
from pathlib import Path
from datetime import datetime, timezone
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from graphify.detect import save_manifest
from graphify.cache import check_semantic_cache

resolved = Path("graphify-out/.graphify_ast_resolved.json")
ast = json.loads((resolved if resolved.exists() else Path("graphify-out/.graphify_ast.json")).read_text())
detect = json.loads(Path("graphify-out/.graphify_detect.json").read_text())

# Preserve semantic doc nodes from a prior /graphify run (cached, no LLM re-run).
doc_files = detect["files"].get("document", []) + detect["files"].get("paper", [])
cached_nodes, cached_edges, cached_hyper, _ = check_semantic_cache(doc_files)
seen = {n["id"] for n in ast["nodes"]}
nodes = list(ast["nodes"]) + [n for n in cached_nodes if n["id"] not in seen]

# Drop hallucinated INFERRED edges now superseded by a real resolved import edge.
imported = {(e["source"], e["target"]) for e in ast["edges"] if e.get("relation") == "imports_from"}
def _superseded(e):
    return e.get("confidence") == "INFERRED" and (
        (e.get("source"), e.get("target")) in imported or (e.get("target"), e.get("source")) in imported)
merged_edges = [e for e in (ast["edges"] + cached_edges) if not _superseded(e)]

extraction = {"nodes": nodes, "edges": merged_edges,
              "hyperedges": ast.get("hyperedges", []) + cached_hyper,
              "input_tokens": 0, "output_tokens": 0}

G = build_from_json(extraction)
communities = cluster(G)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

def auto_label(members):
    parts = Counter()
    for m in members:
        for seg in (G.nodes[m].get("source_file", "") or "").split("/")[:4]:
            if seg:
                parts[seg] += 1
    top = parts.most_common(3)
    return " / ".join(t[0] for t in top) if top else None

labels = {cid: (auto_label(ms) or f"Community {cid}") for cid, ms in communities.items()}
questions = suggest_questions(G, communities, labels)
report = generate(G, communities, cohesion, labels, gods, surprises, detect, {"input": 0, "output": 0}, ".", suggested_questions=questions)
Path("graphify-out/GRAPH_REPORT.md").write_text(report)
# force=True: graphify refuses to shrink an existing graph (#479). That guard is
# right for an incremental `graphify update`, but this pipeline is a FULL rebuild
# from a derived target set — a smaller graph is the intended outcome when a
# target is removed or the scan set narrows. Without force the write is declined
# SILENTLY: GRAPH_REPORT.md and manifest.json update while graph.json keeps
# yesterday's edges, which is the stale-graph failure this whole pipeline exists
# to prevent. Set GRAPHIFY_NO_FORCE=1 to restore the guard.
_force = os.environ.get("GRAPHIFY_NO_FORCE", "").lower() not in ("1", "true", "yes")
if not to_json(G, communities, "graphify-out/graph.json", force=_force):
    print("  WARNING: graph.json was NOT written (shrink guard). Graph is STALE.", file=sys.stderr)
    raise SystemExit(1)
if 0 < G.number_of_nodes() <= 5000:
    to_html(G, communities, "graphify-out/graph.html", community_labels=labels)
save_manifest(detect["files"])

cost_path = Path("graphify-out/cost.json")
cost = json.loads(cost_path.read_text()) if cost_path.exists() else {"runs": [], "total_input_tokens": 0, "total_output_tokens": 0}
cost["runs"].append({"date": datetime.now(timezone.utc).isoformat(), "input_tokens": 0, "output_tokens": 0,
                     "files": detect["total_files"], "package": os.environ.get("GRAPHIFY_LABEL", "MONOREPO (refresh-graph)")})
cost_path.write_text(json.dumps(cost, indent=2))
print(f"  Step 4/5 build: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
PYEOF

# --- Step 5: Module-level rollup (MONOREPO graph only) ---
if ! $SCOPED; then
  $CHECK && "$PYTHON" "$SCRIPT_DIR/module-rollup.py" >/dev/null 2>&1 || true
  $CHECK || "$PYTHON" "$SCRIPT_DIR/module-rollup.py" 2>/dev/null || true
fi

# --- Cleanup + marker ---
rm -f "$OUT_DIR"/.graphify_detect.json "$OUT_DIR"/.graphify_ast.json \
      "$OUT_DIR"/.graphify_ast_resolved.json "$OUT_DIR"/.graphify_analysis.json 2>/dev/null || true
date > "$MARKER"

log ""
if $SCOPED; then
  log "[refresh-graph] done — ${LABEL}/graphify-out/{graph.json, graph.html, GRAPH_REPORT.md} in sync"
else
  log "[refresh-graph] done — monorepo graphify-out/{graph.json, graph.html, graph-modules.html, GRAPH_REPORT.md} in sync"
fi

# --- Per-package pass (monorepo run only) ---
# Per-package graphs are gitignored and duplicate the root graph, so they are
# dead weight in a git hook. Opt in with GRAPHIFY_PACKAGES=1 when you actually
# want package-scoped graphs.
if ! $SCOPED && [ "${GRAPHIFY_PACKAGES:-0}" = "1" ]; then refresh_packages; fi
