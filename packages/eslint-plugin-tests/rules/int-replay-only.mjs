/**
 * @fileoverview `tests/int-replay-only` — a headless module's tests answer
 * every request from a recording, served verbatim by the shared replay
 * (ADR 035, decision 4 and "Rejected").
 *
 * Two shapes are reported:
 *
 * - `ownHandler` — a module test registers its own `msw` handler
 *   (`http.get(...)`, `http.post(...)`, …) for any route other than the guest
 *   token. That handler is an answer the module built: an override, a capture,
 *   a sequence, a forced failure, a re-served boot read. The house shape
 *   (`client-email`, `stats`, `legacy-invoices`) registers exactly one handler,
 *   `http.post("*\/oauth/access_token")`, fed by the recorded guest-token
 *   fixture, because the app mints a guest token before the replay is armed.
 *   A handler whose route is not a static string is reported too: a helper
 *   that takes the route as a parameter is an override factory.
 * - `editedRecording` — in an integration-layer file, an object literal that
 *   spreads a call result and then sets its own keys
 *   (`{ ...recordedSelf(), accounts: [] }`), directly or through a `const`
 *   bound to the call. That is a recording edited into an answer staging never
 *   returned. Unit tests may shape mapper input this way; replay may not.
 *
 * The recorder (`*.fixtures.ts`) talks to staging and is out of scope.
 * Scoped (via `eslint.config.mjs`) to `packages/headless/src/modules/**\/__tests__/**`,
 * minus the modules that own token and transport behaviour.
 *
 * @module packages/eslint-plugin-tests/rules/int-replay-only
 */

import { basenameOf, propertyName, staticString } from "../util.mjs";

const RECORDER_SUFFIX = ".fixtures.ts";
const INT_LAYER = /\.int[.-]|integration|replay/;
const HANDLER_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "all"
]);
const GUEST_TOKEN_ROUTE = /^\*?\/oauth\/access_token$/;

/** The `const` initialiser an identifier is bound to in its own scope chain, else null. */
function constInitOf(context, node) {
  let scope = context.sourceCode.getScope(node);
  while (scope) {
    const variable = scope.set.get(node.name);
    if (variable) {
      const def = variable.defs[0];
      if (
        def?.type === "Variable" &&
        def.parent?.kind === "const" &&
        def.node.init
      ) {
        return def.node.init;
      }
      return null;
    }
    scope = scope.upper;
  }
  return null;
}

/** True when a spread argument is a call result, or a `const` bound to one. */
function spreadsCallResult(context, argument) {
  if (argument.type === "CallExpression") return true;
  if (argument.type !== "Identifier") return false;
  return constInitOf(context, argument)?.type === "CallExpression";
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A headless module's tests answer requests only from recordings served verbatim by the shared replay (ADR 035).",
      recommended: true
    },
    schema: [],
    messages: {
      ownHandler:
        "`http.{{method}}({{route}})` is a module-built answer. The shared replay serves every request from a recording (ADR 035); only the guest-token handler is the module's. Record a scenario step instead.",
      editedRecording:
        "This object spreads a recording and sets its own keys: an edited recording (ADR 035, Rejected). Record a scenario step that returns this state instead."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const name = basenameOf(filename);
    if (name.endsWith(RECORDER_SUFFIX)) return {};
    const intLayer = INT_LAYER.test(name);
    // Local names bound to msw's `http` export.
    const httpNames = new Set();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "msw") return;
        for (const s of node.specifiers) {
          if (
            s.type === "ImportSpecifier" &&
            (s.imported.name ?? s.imported.value) === "http"
          ) {
            httpNames.add(s.local.name);
          }
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        if (
          callee.object.type !== "Identifier" ||
          !httpNames.has(callee.object.name)
        )
          return;
        const method = propertyName(callee.property);
        if (!HANDLER_METHODS.has(method)) return;
        const route = staticString(node.arguments[0]);
        if (route !== null && GUEST_TOKEN_ROUTE.test(route)) return;
        context.report({
          node,
          messageId: "ownHandler",
          data: {
            method,
            route: route === null ? "<computed route>" : JSON.stringify(route)
          }
        });
      },
      ObjectExpression(node) {
        if (!intLayer) return;
        const ownKeys = node.properties.some(p => p.type === "Property");
        if (!ownKeys) return;
        const edited = node.properties.some(
          p =>
            p.type === "SpreadElement" && spreadsCallResult(context, p.argument)
        );
        if (edited) context.report({ node, messageId: "editedRecording" });
      }
    };
  }
};
