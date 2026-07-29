/**
 * @fileoverview `scope-based/no-self-branch` — variance-law clause 4.
 *
 * A scope-based module receives an already-resolved, concrete actor; resolving
 * the `SELF` sentinel is owned by the scope builder (`scope.builder.ts` →
 * `resolveSelfActor` in `scope.utils.ts`), per ADR-001. A module factory /
 * services file must never BRANCH on `SELF` itself — a `case ScopeActorTypes.SELF:`
 * or an `=== ScopeActorTypes.SELF` comparison (in either the enum or the raw
 * `'self'` spelling).
 *
 * A `.as(ScopeActorTypes.SELF)` / `.as('self')` call site and an
 * `{ [ScopeActorTypes.SELF]: … }` scope-matrix key are the documented API, not a
 * branch — they are never reported.
 *
 * A genuinely-tolerated branch (e.g. the operator-gated `auth.services.ts`
 * fall-through) is silenced in place with the native
 * `// eslint-disable-next-line scope-based/no-self-branch -- <reason>` — the
 * mechanism the hand-rolled checker had to hardcode a file path for.
 *
 * Covered branch forms: `case` labels, `==`/`===`/`!=`/`!==` comparisons (incl.
 * behind a one-token `as`/`!` cast), and `[…SELF…].includes(actor)` membership.
 *
 * KNOWN LIMITATIONS (documented, not silently absent):
 *  - Computed-key DISPATCH: `({ [ScopeActorTypes.SELF]: fn })[actor]()` is
 *    exempted like a scope-matrix key — the exemption can't distinguish a
 *    type-shape matrix from an executable dispatch object, so a SELF branch
 *    written as an indexed-and-invoked object literal is not caught.
 *  - A raw `'self'` string that is NOT the actor sentinel (e.g. a HATEOAS
 *    `link.rel === 'self'`) in a branch position IS reported; add an
 *    `eslint-disable` when 'self' is genuinely a non-actor value. No such
 *    branch exists in the tree today.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-self-branch
 */

import {
  classifySelfPosition,
  isBranchPosition,
  isScopeActorSelf,
  isSelfStringLiteral
} from "../util.mjs";

// The one place SELF resolution legitimately lives (ADR-001 / clause 4).
const RESOLUTION_FILE_SUFFIXES = [
  "modules/scope/scope.builder.ts",
  "modules/scope/scope.utils.ts"
];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow branching on the SELF scope-actor sentinel inside a scope-based module; SELF resolution is owned by the scope builder (ADR-001, variance-law clause 4).",
      recommended: true
    },
    schema: [],
    messages: {
      selfBranch:
        "A scope-based module must not branch on `SELF` ({{position}}); it receives an already-resolved concrete actor. Resolve SELF in the scope builder (ADR-001). If this branch is a tolerated exception, silence it with `// eslint-disable-next-line scope-based/no-self-branch -- <reason>`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (RESOLUTION_FILE_SUFFIXES.some(suffix => filename.endsWith(suffix))) {
      return {};
    }

    const report = node => {
      const position = classifySelfPosition(node);
      if (!isBranchPosition(position)) return;
      context.report({
        node,
        messageId: "selfBranch",
        data: {
          position: position === "switch" ? "a `case` label" : "a comparison"
        }
      });
    };

    return {
      MemberExpression(node) {
        if (isScopeActorSelf(node)) report(node);
      },
      Literal(node) {
        if (isSelfStringLiteral(node)) report(node);
      }
    };
  }
};
