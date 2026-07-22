#!/usr/bin/env python3
"""
module-rollup.py — collapse the file-level graph into a module-level graph.

Reads graphify-out/graph.json (file-level) and writes:
  - graphify-out/graph-modules.json
  - graphify-out/graph-modules.html

A "module" is a folder under a recognized convention:
  - packages/headless/src/modules/{name}     → module: headless/{name}
  - packages/client-vue/src/modules/{name}   → module: client-vue/{name}
  - packages/ui/src/ui/{name}                → module: ui/{name}
  - packages/ui/src/form/...                 → module: ui/form
  - packages/{pkg}/src/utils                 → module: {pkg}/utils
  - packages/types/src/data/{category}       → module: types/{category}
  - apps/{app}/src/{name}                    → module: {app}/{name}
  - apps/cart-nuxt/app/{name}                → module: cart-nuxt/{name}

Files that don't match any pattern fall through to the package root (e.g.
packages/headless/src/index.ts → module: headless/_root).

Cross-module edges are aggregated with a weight = number of file-level imports.
Intra-module edges are dropped (they're noise at this zoom level).

Run from monorepo root:
  python3 .agent/scripts/graphify/module-rollup.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import subprocess as _sp
ROOT = Path(_sp.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
GRAPH_PATH = ROOT / "graphify-out" / "graph.json"
OUT_JSON = ROOT / "graphify-out" / "graph-modules.json"
OUT_HTML = ROOT / "graphify-out" / "graph-modules.html"

# Patterns matched in order. First match wins.
# Each pattern returns the module id string (e.g. "headless/basket").
MODULE_PATTERNS: list[tuple[re.Pattern, callable]] = [
    # packages/headless/src/modules/{name}/...
    (re.compile(r"^packages/headless/src/modules/([^/]+)"), lambda m: f"headless/{m.group(1)}"),
    # packages/client-vue/src/modules/{name}/...
    (re.compile(r"^packages/client-vue/src/modules/([^/]+)"), lambda m: f"client-vue/{m.group(1)}"),
    # packages/client-vue/src/components/{name}/...
    (re.compile(r"^packages/client-vue/src/components/([^/]+)"), lambda m: f"client-vue/components/{m.group(1)}"),
    # packages/ui/src/ui/{name}/...
    (re.compile(r"^packages/ui/src/ui/([^/]+)"), lambda m: f"ui/{m.group(1)}"),
    # packages/ui/src/form/renderers/...
    (re.compile(r"^packages/ui/src/form"), lambda m: "ui/form"),
    # packages/ui/src/composables/...
    (re.compile(r"^packages/ui/src/composables"), lambda m: "ui/composables"),
    # packages/ui/src/utils/...
    (re.compile(r"^packages/ui/src/utils"), lambda m: "ui/utils"),
    # packages/headless/src/utils/...
    (re.compile(r"^packages/headless/src/utils"), lambda m: "headless/utils"),
    # packages/client-vue/src/{name}/...  (catch-all for non-modules subdirs)
    (re.compile(r"^packages/client-vue/src/([^/]+)"), lambda m: f"client-vue/{m.group(1)}"),
    # packages/types/src/data/{category}/...
    (re.compile(r"^packages/types/src/data/([^/]+)"), lambda m: f"types/{m.group(1)}"),
    # packages/types/src/{name}/...
    (re.compile(r"^packages/types/src/([^/]+)"), lambda m: f"types/{m.group(1)}"),
    # packages/i18n/src/...
    (re.compile(r"^packages/i18n/src"), lambda m: "i18n/_root"),
    # packages/icons/src/...
    (re.compile(r"^packages/icons/src"), lambda m: "icons/_root"),
    # apps/cart/src/{name}/...
    (re.compile(r"^apps/cart/src/([^/]+)"), lambda m: f"cart/{m.group(1)}"),
    # apps/cart-nuxt/app/{name}/...
    (re.compile(r"^apps/cart-nuxt/app/([^/]+)"), lambda m: f"cart-nuxt/{m.group(1)}"),
    # apps/hosting/src/{name}/...
    (re.compile(r"^apps/hosting/src/([^/]+)"), lambda m: f"hosting/{m.group(1)}"),
    # apps/velia/src/{name}/...
    (re.compile(r"^apps/velia/src/([^/]+)"), lambda m: f"velia/{m.group(1)}"),
    # Fallback: package root file (e.g. packages/headless/vite.config.ts)
    (re.compile(r"^packages/([^/]+)/"), lambda m: f"{m.group(1)}/_root"),
    (re.compile(r"^apps/([^/]+)/"), lambda m: f"{m.group(1)}/_root"),
]


def module_of(source_file: str) -> str | None:
    """Map a source file path to its module id, or None if unrecognized.

    If a pattern captures a path segment that is actually a file (contains "."),
    fall back to the package-level bucket — we don't want single files to
    become their own modules.
    """
    if not source_file:
        return None
    for pat, fn in MODULE_PATTERNS:
        m = pat.match(source_file)
        if m:
            mid = fn(m)
            # The last segment of a module id should be a folder name, not a file.
            tail = mid.rsplit("/", 1)[-1]
            if "." in tail:
                # Captured a file, not a folder → bucket to the parent
                parent = mid.rsplit("/", 1)[0] if "/" in mid else "_root"
                # If parent is just the package name, mark as the package's _root
                if "/" not in parent:
                    return f"{parent}/_root"
                return parent
            return mid
    return None


def package_of(module_id: str) -> str:
    """Extract the top-level package/app from a module id."""
    return module_id.split("/", 1)[0]


def main() -> int:
    if not GRAPH_PATH.exists():
        print(f"ERROR: {GRAPH_PATH} not found.", file=sys.stderr)
        return 1

    data = json.loads(GRAPH_PATH.read_text())
    nodes = data.get("nodes", [])
    links = data.get("links") or data.get("edges") or []

    # Map node id -> module id
    node_to_module: dict[str, str] = {}
    module_members: dict[str, list[str]] = defaultdict(list)
    for n in nodes:
        nid = n.get("id")
        sf = n.get("source_file") or ""
        mid = module_of(sf)
        if mid:
            node_to_module[nid] = mid
            module_members[mid].append(nid)

    print(f"Mapped {len(node_to_module)} of {len(nodes)} nodes to modules")
    print(f"Total modules: {len(module_members)}")

    # Aggregate cross-module edges
    edge_weights: dict[tuple[str, str], int] = defaultdict(int)
    intra_module = 0
    for e in links:
        src = e.get("source")
        tgt = e.get("target")
        # nodes in link-style export can be either ids or dicts
        if isinstance(src, dict):
            src = src.get("id")
        if isinstance(tgt, dict):
            tgt = tgt.get("id")
        ms = node_to_module.get(src)
        mt = node_to_module.get(tgt)
        if not ms or not mt:
            continue
        if ms == mt:
            intra_module += 1
            continue
        edge_weights[(ms, mt)] += 1

    print(f"Cross-module edges: {len(edge_weights)} (dropped {intra_module} intra-module)")

    # Build the module graph as networkx
    try:
        import networkx as nx
        from networkx.readwrite import json_graph
        from graphify.cluster import cluster, score_all
        from graphify.export import to_html
    except ImportError as e:
        print(f"ERROR: missing dependency {e}", file=sys.stderr)
        return 1

    G = nx.Graph()
    for mid, members in module_members.items():
        pkg = package_of(mid)
        # Strip the package prefix from the display label
        short = mid.split("/", 1)[1] if "/" in mid else mid
        G.add_node(
            mid,
            id=mid,
            label=short,
            file_type="module",
            source_file=mid + "/",
            package=pkg,
            member_count=len(members),
        )

    for (s, t), w in edge_weights.items():
        if G.has_edge(s, t):
            G[s][t]["weight"] += w
        else:
            G.add_edge(s, t, weight=w, relation="imports", confidence="EXTRACTED", confidence_score=1.0)

    # Drop orphan modules (no edges in or out)
    orphans = [n for n in list(G.nodes()) if G.degree(n) == 0]
    G.remove_nodes_from(orphans)
    if orphans:
        print(f"Dropped {len(orphans)} orphan modules with no cross-module edges")

    print(f"Module graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    # Cluster modules into "domains"
    communities = cluster(G)
    cohesion = score_all(G, communities)
    for cid, members in communities.items():
        for m in members:
            if m in G:
                G.nodes[m]["community"] = cid

    print(f"Module domains (clusters): {len(communities)}")

    # Auto-label domains by majority package
    domain_labels: dict[int, str] = {}
    for cid, members in communities.items():
        pkgs = defaultdict(int)
        for m in members:
            pkgs[package_of(m)] += 1
        # Pick most common package(s)
        top = sorted(pkgs.items(), key=lambda x: -x[1])
        if len(top) == 1:
            domain_labels[cid] = top[0][0]
        else:
            # Multi-package domain — the interesting cross-package ones
            primaries = [p for p, _ in top if _ >= max(1, top[0][1] // 2)]
            domain_labels[cid] = " + ".join(primaries[:3])

    print()
    print("Module domains:")
    for cid in sorted(communities, key=lambda c: -len(communities[c])):
        members = communities[cid]
        label = domain_labels[cid]
        sample = sorted(members)[:5]
        print(f"  D{cid} [{label}]: {len(members)} modules  e.g. {sample}")

    # Export
    out = json_graph.node_link_data(G, edges="links")
    OUT_JSON.write_text(json.dumps(out, indent=2))
    print()
    print(f"Wrote {OUT_JSON}")

    # HTML
    to_html(G, communities, str(OUT_HTML), community_labels=domain_labels)
    print(f"Wrote {OUT_HTML}")

    # Print the top cross-package edges by weight
    print()
    print("Top 30 module-to-module edges by weight:")
    by_weight = sorted(G.edges(data=True), key=lambda e: -e[2].get("weight", 0))
    for u, v, d in by_weight[:30]:
        print(f"  {u:35s} -> {v:35s}  weight={d.get('weight',0)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
