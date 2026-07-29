const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT = path.resolve(
  __dirname,
  "glossary-resolve.mjs"
);

function run(args) {
  return execFileSync("node", [SCRIPT, ...args], { encoding: "utf8" });
}

test('"cart" resolves to its own term (ADR-007), never conflated back onto basket\'s referents (FE-3003p-AC1 ontology fix)', () => {
  const out = run(["cart"]);
  assert.match(out, /adr:007-headless-architecture/);
  assert.doesNotMatch(out, /useBasket/);
});

test('"basket" carries no "cart" alias — cart is the storefront app, not a basket synonym', () => {
  const out = run(["basket"]);
  assert.match(out, /## basket/); // resolves to the basket term itself
  assert.doesNotMatch(out, /aliases:.*\bcart\b/); // and never lists cart among its aliases
});
