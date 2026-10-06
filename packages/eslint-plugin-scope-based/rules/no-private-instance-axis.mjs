/**
 * @fileoverview `scope-based/no-private-instance-axis` — instance keying is a
 * platform seam, not a module concern.
 *
 * `createScopedComposable` owns registration and `generateScopeKey`
 * (`scope/scope.utils.ts`) owns the key, built from actor + context +
 * `.withId()` id + brand. A module that needs a second instance axis declares
 * it on that seam — a context member — never beside it.
 *
 * Two mechanical tells, both taken from the FE-3034 incident (2026-09-15):
 *
 *  1. **A computed registration NAME.** `createScopedComposable` is called with
 *     anything but a string literal as its first argument — a template literal
 *     (`` `client-custom-fields@${objectType}` ``), or a helper call returning
 *     one. The name IS the registry's identity; computing it per variant mints
 *     a private axis the registry cannot see.
 *  2. **A module-local registration memo.** A module-scope `Map` in a file that
 *     also calls `createScopedComposable` — the cache the registry already is.
 *
 * Both are reported as the same defect from the consumer's side: the module
 * keyed its own instances. Where the platform genuinely blocks the native
 * shape, STOP and escalate to the operator rather than routing around it;
 * `.for(type, id)` demanding an id is the standing example (FE-3239).
 *
 * KNOWN LIMITATIONS (documented, not silently absent):
 *  - A hand-derived CACHE key (the incident's `catalogueQueryKey`) is not
 *    detected. A module legitimately composes query keys, so there is no
 *    low-false-positive AST shape for "this key re-encodes the scope key".
 *    The rule catches the registration axis that forces such a key to exist.
 *  - A registration name held in a module-level `const` that is itself a plain
 *    string literal is VALID — that is a named constant, not a computed name.
 *
 * The scope module itself is exempt: it owns the registry and its cache.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-private-instance-axis
 */

/** The seam's own home — it owns the registry Map and the key builder. */
const SCOPE_MODULE_SEGMENT = "modules/scope/";

/** The registration entry point this rule watches. */
const REGISTRAR = "createScopedComposable";

/**
 * Resolves the callee's name for a plain call (`f()`) and a member call
 * (`ns.f()`) alike, so an imported-and-namespaced registrar is still seen.
 */
function calleeName(node) {
  const { callee } = node;
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return undefined;
}

/** True for a bare string literal — the one valid registration-name shape. */
function isStringLiteral(node) {
  return node?.type === "Literal" && typeof node.value === "string";
}

/**
 * True when the node sits at module scope — its ancestors reach `Program`
 * without passing through a function body.
 */
function isModuleScope(node) {
  let parent = node.parent;
  while (parent) {
    if (parent.type === "Program") return true;
    if (
      parent.type === "FunctionDeclaration" ||
      parent.type === "FunctionExpression" ||
      parent.type === "ArrowFunctionExpression" ||
      parent.type === "ClassBody"
    ) {
      return false;
    }
    parent = parent.parent;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a module minting its own composable-instance axis beside the scope registry; registration and keying are owned by createScopedComposable / generateScopeKey (ADR-001).",
      recommended: true
    },
    schema: [],
    messages: {
      computedName:
        "`createScopedComposable` must take a string-literal registration name. A name computed per variant mints a private instance axis the registry cannot see — declare the variant as a scope context member instead (ADR-001). If the platform blocks that shape, STOP and escalate to the operator rather than routing around it.",
      registrationMemo:
        "A module-scope `Map` beside a `createScopedComposable` call is a private registration cache — the scope registry already is that cache. Remove it and let the registry key the instance (ADR-001)."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (filename.includes(SCOPE_MODULE_SEGMENT)) return {};

    /** Every `createScopedComposable` call seen in this file. */
    const registrarCalls = [];
    /** Every module-scope `new Map(...)` seen in this file. */
    const moduleScopeMaps = [];

    return {
      CallExpression(node) {
        if (calleeName(node) !== REGISTRAR) return;
        registrarCalls.push(node);

        const name = node.arguments[0];
        if (name && !isStringLiteral(name)) {
          context.report({ node: name, messageId: "computedName" });
        }
      },

      NewExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "Map") {
          return;
        }
        if (isModuleScope(node)) moduleScopeMaps.push(node);
      },

      "Program:exit"() {
        if (registrarCalls.length === 0) return;
        for (const map of moduleScopeMaps) {
          context.report({ node: map, messageId: "registrationMemo" });
        }
      }
    };
  }
};
