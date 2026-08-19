#!/usr/bin/env python3
"""
module-rollup.py — collapse the file-level graph into a module-level graph.

GENERIC and zero-config: a "module" is simply the directory that contains each
file (repo-relative) — no hardcoded layer or package names. This generalises
both a component rollup (atoms/molecules/organisms folders) and a
large monorepo's package rollup: in every case files collapse into the folder
that owns them, and cross-file edges aggregate into weighted cross-module edges.

Produces graphify-out/graph-modules.{json,html} — the `pnpm graph:open:modules`
view. Run after the file-level graph exists (refresh.sh Step 5).

Run from the repo root:
  python3 .claude/.shared/scripts/graphify/module-rollup.py
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import networkx as nx
from networkx.readwrite import json_graph
from graphify.cluster import cluster
from graphify.export import to_json, to_html

ROOT = Path.cwd()
GRAPH = ROOT / "graphify-out" / "graph.json"


def module_of(source_file: str) -> str | None:
    """The directory that owns a file, repo-relative. Files directly at the repo
    root collapse under their top-level segment."""
    if not source_file:
        return None
    p = Path(source_file)
    d = str(p.parent)
    if d and d != ".":
        return d
    return p.parts[0] if len(p.parts) > 1 else None


def main() -> int:
    if not GRAPH.exists():
        return 0
    F = json_graph.node_link_graph(json.loads(GRAPH.read_text()), edges="links")

    node_mod: dict[str, str] = {}
    members: dict[str, list[str]] = defaultdict(list)
    for nid, d in F.nodes(data=True):
        m = module_of(d.get("source_file", "") or "")
        if m:
            node_mod[nid] = m
            members[m].append(nid)

    M = nx.Graph()
    for m, mem in members.items():
        M.add_node(m, id=m, label=m, file_type="module", source_file=m + "/", member_count=len(mem))

    weights: dict[tuple[str, str], float] = defaultdict(float)
    for u, v, d in F.edges(data=True):
        a, b = node_mod.get(u), node_mod.get(v)
        if a and b and a != b:
            weights[tuple(sorted((a, b)))] += float(d.get("weight", 1.0) or 1.0)
    for (a, b), w in weights.items():
        M.add_edge(a, b, weight=w, relation="depends_on", confidence="EXTRACTED", confidence_score=1.0)

    if M.number_of_nodes() == 0:
        return 0
    communities = cluster(M)
    for cid, mem in communities.items():
        for m in mem:
            if m in M:
                M.nodes[m]["community"] = cid

    to_json(M, communities, "graphify-out/graph-modules.json")
    if M.number_of_nodes() <= 5000:
        to_html(M, communities, "graphify-out/graph-modules.html",
                community_labels={cid: f"Cluster {cid}" for cid in communities})
    print(f"  Module rollup: {M.number_of_nodes()} modules, {M.number_of_edges()} cross-module edges")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
