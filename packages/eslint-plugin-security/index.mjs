/**
 * @fileoverview `security` — ESLint rules for server-side security principles
 * that a lint can decide, replacing the `code-security` prose.
 *
 *   no-wildcard-cors   — no `origin: "*"` and no wildcard Access-Control-Allow-Origin
 *   no-merge-untrusted — no merge / assign of request input (prototype pollution)
 *   no-dynamic-regexp  — no `new RegExp()` with a non-literal pattern (ReDoS)
 *
 * Scoping to server files lives in the root `eslint.config.mjs`, not in the rules.
 *
 * @module packages/eslint-plugin-security
 */

import noWildcardCors from "./rules/no-wildcard-cors.mjs";
import noMergeUntrusted from "./rules/no-merge-untrusted.mjs";
import noDynamicRegexp from "./rules/no-dynamic-regexp.mjs";

const plugin = {
  meta: { name: "security", version: "1.0.0" },
  rules: {
    "no-wildcard-cors": noWildcardCors,
    "no-merge-untrusted": noMergeUntrusted,
    "no-dynamic-regexp": noDynamicRegexp
  }
};

export default plugin;
