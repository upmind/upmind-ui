/**
 * @fileoverview `async-discipline` — an ESLint plugin carrying the house async
 * hygiene rules, ported from `@collaborationstudio/eslint-config`'s
 * `asyncHygiene` preset. A promise is chainable; treat it that way.
 *
 *   no-promise-try-catch — never wrap an `await` in try/catch. Only the `try`
 *                          BLOCK is inspected; an await in `catch` (recovery) or
 *                          `finally` (cleanup) is legitimate and exempt. AST-only,
 *                          so a BARE promise in a try (no await) is a review
 *                          catch, not a lint catch.
 *   no-await-only-return — never `await` only to return the value. VAR form only;
 *                          pair with @typescript-eslint/return-await
 *                          ['error','never'], which owns the direct form.
 *
 * @module packages/eslint-plugin-async-discipline
 */

import noPromiseTryCatch from "./rules/no-promise-try-catch.mjs";
import noAwaitOnlyReturn from "./rules/no-await-only-return.mjs";

const plugin = {
  meta: { name: "async-discipline", version: "1.0.0" },
  rules: {
    "no-promise-try-catch": noPromiseTryCatch,
    "no-await-only-return": noAwaitOnlyReturn
  }
};

export default plugin;
