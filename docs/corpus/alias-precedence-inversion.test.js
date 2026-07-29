const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

const SCRIPT = path.resolve(
  __dirname,
  "glossary-resolve.mjs"
);

const FIXTURE = {
  glossary: {
    terms: {
      widget: {
        term: "widget",
        kind: "domain",
        aliases: ["thing"],
        definition: "The exact-slug term.",
        referents: [
          { type: "symbol", id: "@upmind-automation/headless!useWidget" }
        ]
      },
      gizmo: {
        term: "gizmo",
        kind: "domain",
        aliases: ["widget"],
        definition:
          "A different term whose alias collides with widget's own slug.",
        referents: [
          { type: "symbol", id: "@upmind-automation/headless!useGizmo" }
        ]
      }
    }
  },
  index: {
    "@upmind-automation/headless!useWidget": {
      kind: "symbol",
      path: "packages/headless/src/modules/widget/useWidget.ts",
      module: "widget",
      title: "useWidget"
    },
    "@upmind-automation/headless!useGizmo": {
      kind: "symbol",
      path: "packages/headless/src/modules/gizmo/useGizmo.ts",
      module: "gizmo",
      title: "useGizmo"
    }
  }
};

test("an exact term-slug match wins over a colliding alias of another term (plan panel P2-1)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "glossary-precedence-"));
  const corpusPath = path.join(dir, "corpus.json");
  writeFileSync(corpusPath, JSON.stringify(FIXTURE));
  try {
    const out = execFileSync(
      "node",
      [SCRIPT, "--corpus", corpusPath, "widget"],
      { encoding: "utf8" }
    );
    assert.match(out, /## widget \(domain\)/);
    assert.doesNotMatch(out, /## gizmo \(domain\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
