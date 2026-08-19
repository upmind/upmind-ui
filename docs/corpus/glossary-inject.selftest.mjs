/**
 * Prover self-test for FE-3003 3003p-AC3/AC5 (push/inject).
 *
 * Black-box: spawns docs/corpus/glossary-inject.mjs and asserts on its
 * stdout/exit-code contract only — never imports its internals.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, 'glossary-inject.mjs');
const CORPUS_PATH = path.join(HERE, 'corpus.json');
const GLOSSARY_PATH = path.join(HERE, 'glossary.json'); // the slim file the hook actually reads (FE-3003 W5)
const REPO_ROOT = path.resolve(HERE, '../..');
const SETTINGS_PATH = path.join(REPO_ROOT, '.claude', 'settings.json');

function invoke(stdin, extraArgs = []) {
  return spawnSync('node', [SCRIPT, ...extraArgs], { encoding: 'utf8', input: stdin });
}

test('a tool call touching a glossary referent path emits a guarded additionalContext hit', () => {
  const stdin = JSON.stringify({
    tool_name: 'Read',
    tool_input: { file_path: 'packages/headless/src/modules/basket/useBasket.ts' },
  });
  const result = invoke(stdin);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(parsed.hookSpecificOutput.additionalContext, /basket/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /packages\/headless\/src\/modules\/basket\/useBasket\.ts/);
});

test("a tool call touching a module file surfaces that module's own docs/ set (push, path-triggered)", () => {
  const stdin = JSON.stringify({
    tool_name: 'Read',
    tool_input: { file_path: 'packages/headless/src/modules/client-email-history/useClientReceivedEmail.ts' },
  });
  const result = invoke(stdin);
  assert.equal(result.status, 0);
  const ctx = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  assert.match(ctx, /module "client-email-history" has its own docs/);
  assert.match(ctx, /packages\/headless\/src\/modules\/client-email-history\/docs\//);
  assert.match(ctx, /README\.md/);
});

test('a file under a module with no docs/ folder emits no module-docs pointer (exit 0, empty stdout)', () => {
  const stdin = JSON.stringify({
    tool_name: 'Read',
    tool_input: { file_path: 'packages/headless/src/modules/__nonexistent_zzz__/foo.ts' },
  });
  const result = invoke(stdin);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('a tool call touching nothing glossary-relevant degrades silently (exit 0, empty stdout)', () => {
  const stdin = JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'README.md' } });
  const result = invoke(stdin);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('unreadable/malformed stdin degrades silently (exit 0, empty stdout), never throws', () => {
  const result = invoke('this is not json');
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('a missing corpus.json degrades silently (exit 0, empty stdout), never throws', () => {
  const stdin = JSON.stringify({
    tool_name: 'Read',
    tool_input: { file_path: 'packages/headless/src/modules/basket/useBasket.ts' },
  });
  const result = invoke(stdin, ['--corpus', '/nonexistent/corpus.json']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('every digest segment carries its OWN term\'s referent paths — a term→referent mis-mapping is caught, not just membership in the index', () => {
  const stdin = JSON.stringify({
    tool_name: 'Bash',
    tool_input: { command: 'grep basket session scope' },
  });
  const result = invoke(stdin);
  assert.equal(result.status, 0);
  assert.notEqual(result.stdout, '');
  const digest = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  // Resolve the expected paths PER TERM independently, from the same file the
  // hook reads — so a segment carrying another term's path fails, where a bare
  // "is it a known index path" check would have passed (it always does).
  const { glossary, index } = JSON.parse(readFileSync(GLOSSARY_PATH, 'utf8'));
  const expectedPaths = (slug) =>
    [...new Set((glossary.terms[slug]?.referents ?? []).map((r) => index[r.id]?.path).filter(Boolean))].sort();
  const segments = digest.replace(/^glossary: /, '').split(' | ');
  let checked = 0;
  for (const segment of segments) {
    const slug = segment.match(/^([a-z0-9-]+)/)?.[1];
    assert.ok(slug, `expected segment "${segment}" to start with a term slug`);
    const trailingParens = segment.match(/\(([^()]*)\)\s*$/);
    assert.ok(trailingParens, `expected segment "${segment}" to end with a (path, ...) group`);
    assert.deepEqual(
      trailingParens[1].split(', ').sort(),
      expectedPaths(slug),
      `segment for "${slug}" must carry exactly its own referent paths`,
    );
    checked += 1;
  }
  assert.ok(checked > 0, 'expected at least one resolved segment in the digest');
});

test('the injected digest stays bounded to a small fixed number of terms as the glossary grows (AC5)', () => {
  const stdin = JSON.stringify({
    tool_name: 'Bash',
    tool_input: {
      command:
        'grep basket session scope product promotion currency domain theming query payment-gateway cart',
    },
  });
  const result = invoke(stdin);
  assert.equal(result.status, 0);
  const digest = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  const termCount = digest.split(' | ').length;
  assert.ok(termCount <= 3, `expected the digest bounded to <=3 terms, got ${termCount}`);
});

test('the PreToolUse hook is wired in .claude/settings.json', () => {
  assert.ok(existsSync(SETTINGS_PATH), 'expected monorepo/.claude/settings.json to exist');
  const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
  const preToolUse = settings.hooks?.PreToolUse ?? [];
  const wired = preToolUse.some((entry) =>
    (entry.hooks ?? []).some((h) => String(h.command ?? '').includes('glossary-inject.mjs')),
  );
  assert.ok(wired, 'expected a PreToolUse hooks entry invoking glossary-inject.mjs');
});
