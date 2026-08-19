/**
 * Prover self-test for FE-3003 3003p-AC2 (pull/resolve).
 *
 * Black-box: spawns docs/corpus/glossary-resolve.mjs and asserts on its
 * stdout/stderr/exit-code contract only — never imports its internals.
 * Fixtures live in docs/corpus/fixtures/glossary-resolve-*.json.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'glossary-resolve.mjs');
const CORPUS = path.join(HERE, 'corpus.json');
const FIXTURES = path.join(HERE, 'fixtures');

function run(args) {
  return execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}

function runExpectFailure(args) {
  try {
    run(args);
    throw new Error('expected the CLI to exit non-zero, it exited 0');
  } catch (err) {
    if (err.status === undefined) throw err;
    return err;
  }
}

test('known term "basket" resolves to its living headless referent path', () => {
  const out = run(['basket']);
  assert.match(out, /packages\/headless\/src\/modules\/basket\/useBasket\.ts/);
});

test('"cart" is its own term (storefront app, ADR-007) — not an alias of "basket" (ontology fix, FE-3003p-AC1)', () => {
  const cartOut = run(['cart']);
  assert.match(cartOut, /## cart \(system\)/);
  assert.match(cartOut, /adr:007-headless-architecture/);
  assert.doesNotMatch(cartOut, /useBasket/);
  assert.notEqual(cartOut, run(['basket']));
});

test('"basket" resolves only to its own headless referents, never the cart ADR (ontology fix, FE-3003p-AC1)', () => {
  const basketOut = run(['basket']);
  assert.match(basketOut, /## basket \(domain\)/);
  assert.doesNotMatch(basketOut, /adr:007-headless-architecture/);
});

test("resolving a term whose referent lives in a module surfaces that module's docs/ set (pull face, operator ruling 2026-08-19)", () => {
  const out = run(['basket']);
  assert.match(out, /module docs \(read before changing the module\):/);
  assert.match(out, /basket: packages\/headless\/src\/modules\/basket\/docs\/foundation\.md/);
});

test('a term whose referents are all cross-cutting (an ADR) adds no module-docs section', () => {
  const out = run(['cart']);
  assert.doesNotMatch(out, /module docs \(read before changing the module\)/);
});

test('an unknown term or alias exits 1 and names the miss', () => {
  const err = runExpectFailure(['not-a-real-term-xyz']);
  assert.equal(err.status, 1);
  assert.match(err.stderr, /not-a-real-term-xyz/);
});

test('every glossary referent id resolves through corpus.index — no unresolved referents', () => {
  const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'));
  const terms = corpus.glossary.terms;
  const slugs = Object.keys(terms);
  assert.ok(slugs.length > 0, 'expected at least one glossary term to exist');
  for (const slug of slugs) {
    const out = run([slug]);
    const referentCount = (terms[slug].referents ?? []).length;
    const resolvedCount = (out.match(/ -> /g) ?? []).length;
    assert.equal(
      resolvedCount,
      referentCount,
      `expected all ${referentCount} referent(s) of "${slug}" to resolve, got ${resolvedCount}`,
    );
  }
});

test('an exact term-slug match wins over a colliding alias of another term (plan panel P2-1)', () => {
  const out = run(['--corpus', path.join(FIXTURES, 'glossary-resolve-precedence.json'), 'widget']);
  assert.match(out, /## widget \(domain\)/);
  assert.doesNotMatch(out, /## gizmo \(domain\)/);
});

test('a genuine alias tie prints every tied match and warns, never silently picking one', () => {
  const out = execFileSync(
    'node',
    [SCRIPT, '--corpus', path.join(FIXTURES, 'glossary-resolve-alias-tie.json'), 'thing'],
    { encoding: 'utf8' },
  );
  assert.match(out, /## widget \(domain\)/);
  assert.match(out, /## gizmo \(domain\)/);
});

test('a genuine alias tie warns on stderr rather than silently picking a winner', () => {
  const result = spawnSync(
    'node',
    [SCRIPT, '--corpus', path.join(FIXTURES, 'glossary-resolve-alias-tie.json'), 'thing'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0);
  assert.match(result.stderr, /shared alias of 2 terms/);
});

test('a referent id absent from corpus.index is a corpus-integrity failure (exit 2), never a silent drop', () => {
  const err = runExpectFailure(['--corpus', path.join(FIXTURES, 'glossary-resolve-dangling-referent.json'), 'ghost']);
  assert.equal(err.status, 2);
  assert.match(err.stderr, /useNonexistent/);
});

test('emitted output is bounded — resolving a single term does not dump the whole corpus', () => {
  const out = run(['basket']);
  assert.ok(out.length < 5_000, `expected a single-term resolve under 5KB, got ${out.length} bytes`);
});

test('glossary is populated past the FE-3003p-AC1 term-floor (>= 20 terms)', () => {
  const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'));
  const termCount = Object.keys(corpus.glossary.terms).length;
  assert.ok(termCount >= 20, `expected >= 20 glossary terms (AC1 floor), got ${termCount}`);
});

test('gate:symbols is green against the populated glossary (FE-3003p-AC1)', () => {
  const result = spawnSync('node', [path.join(HERE, 'gates', 'gate-symbols.mjs')], { encoding: 'utf8' });
  assert.equal(result.status, 0, `expected gate:symbols exit 0, got ${result.status}: ${result.stderr}`);
});
