#!/usr/bin/env bash
# refresh.sh — rebuild the cross-package knowledge graph from scratch.
#
# Runs the full pipeline:
#   1. Detect source files in configured targets
#   2. AST extraction (free — no LLM)
#   3. Resolver post-process (fix alias + relative import edges)
#   4. Build graph + cluster + label + report
#   5. Module-level rollup (graph-modules.{html,json})
#
# Usage:
#   bash .claude/scripts/graphify/refresh.sh           # always run
#   bash .claude/scripts/graphify/refresh.sh --check   # exit 0 silently if no code changed since last run
#
# Idempotent and safe to call from a git post-merge hook.
set -euo pipefail

# Detect repo root via git, so the script works regardless of where it lives.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

SCRIPTS_DIR="$ROOT/.claude/scripts/graphify"
OUT_DIR="$ROOT/graphify-out"
MARKER="$OUT_DIR/.refresh_marker"

PYTHON="${PYTHON:-$(command -v python3)}"
[ -z "$PYTHON" ] && { echo "[refresh-graph] ERROR: python3 not found in PATH"; exit 1; }

# Targets to graph. Edit this list if you add or remove packages/apps.
ALL_TARGETS=(
  "packages/headless"
  "packages/ui"
  "packages/client-vue"
  "packages/types"
  "apps/cart"
  "apps/cart-nuxt"
  "apps/hosting"
  "apps/velia"
)
# Drop targets whose dir is missing or empty (e.g. an uncheckedout submodule)
TARGETS=()
for t in "${ALL_TARGETS[@]}"; do
  if [ -d "$t" ] && [ -n "$(ls -A "$t" 2>/dev/null)" ]; then
    TARGETS+=("$t")
  fi
done

# --- Auto-install graphify if missing (don't break the dev's pull) ---
if ! "$PYTHON" -c "import graphify" 2>/dev/null; then
  echo "[refresh-graph] Installing graphify Python package (one-time setup)..."
  "$PYTHON" -m pip install --quiet graphifyy 2>/dev/null \
    || "$PYTHON" -m pip install --quiet --break-system-packages graphifyy 2>/dev/null \
    || { echo "[refresh-graph] could not install graphify — skipping graph refresh"; exit 0; }
fi

# --- Fast-exit check ---
if [ "${1:-}" = "--check" ]; then
  if [ -f "$MARKER" ]; then
    LATEST=$(find "${TARGETS[@]}" \
      \( -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.js" \) \
      -not -path "*/node_modules/*" \
      -not -path "*/dist/*" \
      -not -path "*/.nuxt/*" \
      -not -path "*/graphify-out/*" \
      -newer "$MARKER" \
      -print -quit 2>/dev/null || true)
    if [ -z "$LATEST" ]; then
      exit 0
    fi
  fi
fi

echo "[refresh-graph] Starting full rebuild..."
START=$(date +%s)

mkdir -p "$OUT_DIR"
"$PYTHON" -c "import sys; open('$OUT_DIR/.graphify_python', 'w').write(sys.executable)"

# --- Step 1: Detect ---
echo "[refresh-graph] Step 1/5: detecting files..."
"$PYTHON" - "${TARGETS[@]}" <<'PYEOF'
import json
import sys
from graphify.detect import detect
from pathlib import Path

targets = sys.argv[1:]
all_files = {"code": [], "document": [], "paper": [], "image": [], "video": []}
total_words = 0

for t in targets:
    r = detect(Path(t))
    for cat, files in r["files"].items():
        all_files[cat].extend([str(f) for f in files])
    total_words += r["total_words"]

for cat in all_files:
    all_files[cat] = [
        f for f in all_files[cat]
        if "graphify-out" not in f
        and "node_modules" not in f
        and "/dist/" not in f
        and "/.nuxt/" not in f
    ]
all_files["image"] = []

merged = {
    "files": all_files,
    "total_files": sum(len(v) for v in all_files.values()),
    "total_words": total_words,
    "needs_graph": True,
    "warning": None,
    "skipped_sensitive": [],
}
Path("graphify-out/.graphify_detect.json").write_text(json.dumps(merged))
print(f"  Files: {merged['total_files']}, code: {len(all_files['code'])}, docs: {len(all_files['document'])}")
PYEOF

# --- Step 2: AST extraction ---
echo "[refresh-graph] Step 2/5: AST extraction (no LLM)..."
"$PYTHON" - <<'PYEOF'
import json
from graphify.extract import collect_files, extract
from pathlib import Path

code_files = []
detect = json.loads(Path("graphify-out/.graphify_detect.json").read_text())
for f in detect.get("files", {}).get("code", []):
    p = Path(f)
    code_files.extend(collect_files(p) if p.is_dir() else [p])

result = extract(code_files)
Path("graphify-out/.graphify_ast.json").write_text(json.dumps(result, indent=2))
print(f"  AST: {len(result['nodes'])} nodes, {len(result['edges'])} raw edges")
PYEOF

# --- Step 3: Resolver ---
echo "[refresh-graph] Step 3/5: resolving import edges..."
"$PYTHON" "$SCRIPTS_DIR/resolver.py" | grep -E "^(  )?(Resolved:|Dropped|Wrote|Top|packages/|apps/)" || true

# --- Step 4: Build + cluster + report ---
echo "[refresh-graph] Step 4/5: building graph..."
"$PYTHON" - <<'PYEOF'
import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from graphify.detect import save_manifest
from graphify.cache import check_semantic_cache
from datetime import datetime, timezone

resolved_ast = json.loads(Path("graphify-out/.graphify_ast_resolved.json").read_text())
detect = json.loads(Path("graphify-out/.graphify_detect.json").read_text())

doc_files = detect["files"].get("document", []) + detect["files"].get("paper", [])
cached_nodes, cached_edges, cached_hyper, _ = check_semantic_cache(doc_files)

seen = {n["id"] for n in resolved_ast["nodes"]}
merged_nodes = list(resolved_ast["nodes"])
for n in cached_nodes:
    if n["id"] not in seen:
        merged_nodes.append(n)
        seen.add(n["id"])

extraction = {
    "nodes": merged_nodes,
    "edges": resolved_ast["edges"] + cached_edges,
    "hyperedges": resolved_ast.get("hyperedges", []) + cached_hyper,
    "input_tokens": 0,
    "output_tokens": 0,
}

G = build_from_json(extraction)
communities = cluster(G)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

def auto_label(members, G):
    from collections import Counter
    files = [G.nodes[m].get("source_file", "") for m in members if m in G]
    parts = Counter()
    for f in files:
        for seg in f.split("/")[:4]:
            parts[seg] += 1
    if not parts:
        return None
    top = parts.most_common(3)
    return " / ".join(t[0] for t in top if t[0])

labels = {cid: auto_label(members, G) or f"Community {cid}" for cid, members in communities.items()}
questions = suggest_questions(G, communities, labels)

report = generate(G, communities, cohesion, labels, gods, surprises, detect, {"input": 0, "output": 0}, ".", suggested_questions=questions)
Path("graphify-out/GRAPH_REPORT.md").write_text(report)
to_json(G, communities, "graphify-out/graph.json")
to_html(G, communities, "graphify-out/graph.html", community_labels=labels)
save_manifest(detect["files"])

cost_path = Path("graphify-out/cost.json")
cost = json.loads(cost_path.read_text()) if cost_path.exists() else {"runs": [], "total_input_tokens": 0, "total_output_tokens": 0}
cost["runs"].append({
    "date": datetime.now(timezone.utc).isoformat(),
    "input_tokens": 0,
    "output_tokens": 0,
    "files": detect["total_files"],
    "package": "MONOREPO (refresh-graph)",
})
cost_path.write_text(json.dumps(cost, indent=2))

print(f"  Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
PYEOF

# --- Step 5: Module rollup ---
echo "[refresh-graph] Step 5/5: module rollup..."
"$PYTHON" "$SCRIPTS_DIR/module-rollup.py" | grep -E "^(Mapped|Total modules|Cross-module|Module graph|Module domains|Wrote)" || true

# --- Cleanup intermediates ---
rm -f "$OUT_DIR/.graphify_detect.json" \
      "$OUT_DIR/.graphify_ast.json" \
      "$OUT_DIR/.graphify_ast_resolved.json" \
      "$OUT_DIR/.graphify_analysis.json"

date > "$MARKER"

END=$(date +%s)
DURATION=$((END - START))
echo
echo "[refresh-graph] Done in ${DURATION}s"
echo "  graphify-out/graph.html          file-level interactive"
echo "  graphify-out/graph-modules.html  module-level rollup"
echo "  graphify-out/GRAPH_REPORT.md     audit report"
