const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT = path.resolve(
  __dirname,
  "glossary-resolve.mjs"
);

test("an unknown term or alias exits non-zero and names the miss on stderr", () => {
  assert.throws(
    () =>
      execFileSync("node", [SCRIPT, "not-a-real-term-xyz"], {
        encoding: "utf8"
      }),
    err => {
      assert.equal(err.status, 1);
      assert.match(err.stderr, /not-a-real-term-xyz/);
      return true;
    }
  );
});
