/**
 * @fileoverview `scope-based` — the ESLint plugin enforcing the scope-based
 * composable variance law (ADR-001 / FE-2967). It replaces the hand-rolled
 * `law-checker.mjs`: five AST rules that run inside the repo's single flat
 * config, gaining editor squiggles, CI wiring, and the native
 * `// eslint-disable-*` waiver mechanism (disable / disable-line /
 * disable-next-line) for free.
 *
 *   no-self-branch      — clause 4: a module must not branch on the SELF sentinel
 *   require-decision    — clause 5: every @decision carries what/why/rejected
 *   no-cosplay-arm      — clauses 2+3: no byte-identical override, no empty scaffold
 *   complete-layer-set  — clause 1 (decidable): full sub-layer set + @internal markers
 *   arm-in-matrix       — an arm's actor must be declared in the scope matrix
 *
 * @module packages/eslint-plugin-scope-based
 */

import noSelfBranch from "./rules/no-self-branch.mjs";
import requireDecision from "./rules/require-decision.mjs";
import noCosplayArm from "./rules/no-cosplay-arm.mjs";
import completeLayerSet from "./rules/complete-layer-set.mjs";
import armInMatrix from "./rules/arm-in-matrix.mjs";

const plugin = {
  meta: { name: "scope-based", version: "1.0.0" },
  rules: {
    "no-self-branch": noSelfBranch,
    "require-decision": requireDecision,
    "no-cosplay-arm": noCosplayArm,
    "complete-layer-set": completeLayerSet,
    "arm-in-matrix": armInMatrix
  }
};

export default plugin;
