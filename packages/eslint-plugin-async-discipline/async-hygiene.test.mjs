/**
 * @fileoverview RuleTester specs for the `async-discipline` plugin.
 *
 * Two async-hygiene rules, each with its documented SCOPE asymmetries that make
 * it safe to run repo-wide:
 *   - no-promise-try-catch: an awaited promise inside try/catch should chain
 *     (.catch) instead; catch/finally handlers and nested functions are exempt.
 *   - no-await-only-return: `const x = await g(); return x` should be `return g()`;
 *     the value must be consumed to be kept, `var` and the direct `return await`
 *     form are excluded.
 *
 * Run: node --test packages/eslint-plugin-async-discipline/async-hygiene.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noPromiseTryCatch from "./rules/no-promise-try-catch.mjs";
import noAwaitOnlyReturn from "./rules/no-await-only-return.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module"
  }
});

test("no-promise-try-catch", () => {
  ruleTester.run("no-promise-try-catch", noPromiseTryCatch, {
    valid: [
      "async function f() { const x = await g().catch(() => null); if (!x) return null; return x }",
      "function f() { try { JSON.parse(raw) } catch { return null } }",
      "async function f() { try { sync() } catch { await rollback() } }",
      "function f() { try { const cb = async () => { await g() } } catch { return null } }",
      "function f(u) { try { const p = new URL(u); if (p.host) return p } catch { } }"
    ],
    invalid: [
      {
        code: "async function f() { try { await g() } catch { return null } }",
        errors: [{ messageId: "promiseTryCatch" }]
      },
      {
        code: "async function f() { try { const x = await g(); use(x) } catch { return null } }",
        errors: [{ messageId: "promiseTryCatch" }]
      },
      {
        code: "async function f() { try { sync() } finally { await close() } }",
        errors: [{ messageId: "promiseTryCatch" }]
      },
      {
        code: "async function f() { try { sync() } catch { fallback() } finally { await close() } }",
        errors: [{ messageId: "promiseTryCatch" }]
      }
    ]
  });
});

test("no-await-only-return", () => {
  ruleTester.run("no-await-only-return", noAwaitOnlyReturn, {
    valid: [
      "async function f() { return g() }",
      "async function f() { const x = await g(); if (!x) return null; return x }",
      "async function f() { const x = await g(); return x.id }",
      "async function f() { const a = await g(); const b = await h(a); return b.id }",
      "async function f() { var x = await g(); return x }",
      "async function f() { return await g() }"
    ],
    invalid: [
      {
        code: "async function f() { const x = await g(); return x }",
        errors: [{ messageId: "awaitOnlyReturn" }]
      },
      {
        code: "async function f() { let y = await g(); return y }",
        errors: [{ messageId: "awaitOnlyReturn" }]
      },
      {
        code: "async function f() { const a = await g(); const b = await h(a); return b }",
        errors: [{ messageId: "awaitOnlyReturn" }]
      }
    ]
  });
});
