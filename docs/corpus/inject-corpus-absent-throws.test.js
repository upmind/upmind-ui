const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT = path.resolve(
  __dirname,
  "glossary-inject.mjs"
);

test("a missing corpus.json degrades silently (exit 0, empty stdout) and never throws", () => {
  const out = execFileSync(
    "node",
    [SCRIPT, "--corpus", "/nonexistent/corpus.json"],
    {
      encoding: "utf8",
      input:
        '{"tool_name":"Read","tool_input":{"file_path":"packages/headless/src/modules/basket/useBasket.ts"}}'
    }
  );
  assert.equal(out, "");
});
