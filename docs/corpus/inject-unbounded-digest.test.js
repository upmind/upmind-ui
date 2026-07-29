const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

const SCRIPT = path.resolve(__dirname, "glossary-inject.mjs");

// Five single-word terms all matched by the one command below, so matchTerms
// returns 5 candidates — strictly more than the MAX_TERMS_PER_INJECT cap of 3.
// A fixture (not the real corpus) is what makes the bound observable: it
// guarantees the cap actually trims, so dropping it is detectable.
const term = (slug) => ({ term: slug, kind: "domain", aliases: [], definition: `The ${slug} term.`, referents: [] });
const FIXTURE = {
  glossary: { terms: { alpha: term("alpha"), bravo: term("bravo"), charlie: term("charlie"), delta: term("delta"), echo: term("echo") } },
  index: {},
};

test("the injected digest stays bounded to a small fixed number of terms as the glossary grows (AC5, inject-laws §3.11 failure class)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "glossary-inject-bound-"));
  const corpusPath = path.join(dir, "corpus.json");
  writeFileSync(corpusPath, JSON.stringify(FIXTURE));
  const input = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: "grep alpha bravo charlie delta echo" },
  });
  try {
    const out = execFileSync("node", [SCRIPT, "--corpus", corpusPath], { encoding: "utf8", input });
    assert.notEqual(out, "");
    const digest = JSON.parse(out).hookSpecificOutput.additionalContext;
    const termCount = digest.split(" | ").length;
    assert.ok(termCount <= 3, `expected the digest bounded to <=3 terms, got ${termCount}: ${digest}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
