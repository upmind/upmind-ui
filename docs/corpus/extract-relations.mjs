#!/usr/bin/env node
// docs/corpus/extract-relations.mjs — FE-2752 T2 (design §5.3)
//
// Relations snapshot extractor: reads the local graphify graph and emits a
// committed, machine-owned snapshot the corpus build (T3) consumes in CI
// without graphify (graphify-out/ is gitignored — .gitignore:45-46 — and the
// graphify CLI is local-only, §2.4). It keeps exactly two things and drops the
// rest (layout/community fields):
//
//   edges — the edge list in graphify SLUG space
//           { from, to, relation, confidence, sourceFile }
//           (_src / _tgt / relation / confidence_score / source_file)
//   nodes — the id-bridge table that lets build.mjs escape slug space (§5.3):
//           slug → { label, normLabel, sourceFile, sourceLine }
//
// Output is byte-deterministic (edges sorted by a code-point comparator, node
// keys sorted, fixed key order, no wall clock) so meta.relationsSha256 (§8.2)
// pins a stable value across environments. No runtime deps — plain node ESM,
// matching the docs-corpus-gate.mjs sibling.
//
// Usage: node docs/corpus/extract-relations.mjs [graph.json] [relations.json]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const IN = process.argv[2] ?? 'graphify-out/graph.json';
const OUT = process.argv[3] ?? 'docs/corpus/relations.json';

// Precondition (T2): graphify-out/ is gitignored and absent in a fresh
// worktree — fail loud with the remedy rather than silently producing nothing.
if (!existsSync(IN)) {
  console.error(
    `FAIL: ${IN} not found. graphify-out/ is gitignored (.gitignore:45-46, ` +
      `**/graphify-out/) and absent in a fresh git worktree — copy graphify-out/ ` +
      `in from the primary checkout OR run \`graphify update .\` in the worktree ` +
      `first, then re-run this extractor.`,
  );
  process.exit(1);
}

let graph;
try {
  graph = JSON.parse(readFileSync(IN, 'utf8'));
} catch (err) {
  console.error(`FAIL: could not parse ${IN} as JSON — ${err.message}`);
  process.exit(1);
}

const rawNodes = Array.isArray(graph.nodes) ? graph.nodes : null;
const rawLinks = Array.isArray(graph.links) ? graph.links : null;
if (!rawNodes || !rawLinks) {
  console.error(
    `FAIL: ${IN} is not a graphify graph (expected top-level nodes[] and links[]).`,
  );
  process.exit(1);
}

// --- node table (§5.3 id bridge) -------------------------------------------
// slug → { label, normLabel, sourceFile, sourceLine }. Every graphify node
// carries source_file + source_location (verified 0 missing of 2597, §2.4);
// source_location is always "L<n>" — parse to a number for the changelog join.
const parseLine = (loc) => {
  const m = /^L(\d+)$/.exec(String(loc ?? ''));
  return m ? Number(m[1]) : null;
};

const nodeById = new Map();
for (const n of rawNodes) {
  if (!n || n.id == null) continue;
  nodeById.set(String(n.id), {
    label: n.label ?? null,
    normLabel: n.norm_label ?? null,
    sourceFile: n.source_file ?? null,
    sourceLine: parseLine(n.source_location),
  });
}
const nodes = {};
for (const slug of [...nodeById.keys()].sort()) nodes[slug] = nodeById.get(slug);

// --- edges ------------------------------------------------------------------
// _src/_tgt/relation/confidence_score/source_file → {from,to,relation,confidence,sourceFile}.
// Drop weight, the string `confidence` label, source/target aliases, and every
// layout/community field. Fail loud on a malformed edge rather than emit a
// snapshot the id bridge cannot join.
const edges = [];
let malformed = 0;
for (const l of rawLinks) {
  if (!l || l._src == null || l._tgt == null || l.relation == null) {
    malformed++;
    continue;
  }
  edges.push({
    from: String(l._src),
    to: String(l._tgt),
    relation: String(l.relation),
    confidence: typeof l.confidence_score === 'number' ? l.confidence_score : null,
    sourceFile: l.source_file ?? null,
  });
}
if (malformed > 0) {
  console.error(
    `FAIL: ${malformed} edge(s) in ${IN} are missing _src/_tgt/relation — ` +
      `the graph is malformed; regenerate with \`graphify update .\`.`,
  );
  process.exit(1);
}

// Total, code-point comparator (NOT localeCompare — locale-independent so the
// byte output and its sha256 pin are the same on every machine and in CI).
const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
edges.sort(
  (a, b) =>
    byCodePoint(a.from, b.from) ||
    byCodePoint(a.to, b.to) ||
    byCodePoint(a.relation, b.relation) ||
    byCodePoint(a.sourceFile ?? '', b.sourceFile ?? '') ||
    (a.confidence ?? 0) - (b.confidence ?? 0),
);

// --- write ------------------------------------------------------------------
// Top-level key order [edges, nodes] and every record's key order are fixed by
// literal insertion; nodes keys were inserted sorted above. JSON.stringify
// preserves insertion order, so the bytes are a pure function of the graph.
const out = { edges, nodes };
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

const relCounts = {};
for (const e of edges) relCounts[e.relation] = (relCounts[e.relation] ?? 0) + 1;
const relSummary = Object.entries(relCounts)
  .sort(([a], [b]) => byCodePoint(a, b))
  .map(([k, v]) => `${k}=${v}`)
  .join(', ');
console.log(
  `extract-relations: ${edges.length} edges, ${Object.keys(nodes).length} nodes → ${OUT}`,
);
console.log(`  relations: ${relSummary}`);
