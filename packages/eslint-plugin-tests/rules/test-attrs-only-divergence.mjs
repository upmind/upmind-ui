/**
 * @fileoverview `tests/test-attrs-only-divergence` — in production source,
 * `useTestAttrs` (FE-2865) is the only sanctioned test-mode divergence. This
 * rule replaces the stale `ci/lint-scope-purity.mjs` claim in the
 * code-tests-e2e companion; that file does not exist.
 *
 * Flags a test-mode branch other than `useTestAttrs`:
 *  - a comparison of `process.env.NODE_ENV` or `import.meta.env.MODE` against
 *    `"test"`, `"testing"` or `"e2e"`
 *  - a read of an `import.meta.env.VITE_*TEST*` / `VITE_*E2E*` flag
 *  - a read of an identifier named `isTest`, `isTesting`, `isTestMode`,
 *    `isE2E`, `isE2e`, `IS_TEST` or `IS_E2E`
 *  - a probe for a test runner global (`window.Cypress`, `window.__playwright`,
 *    `navigator.webdriver`)
 *
 * Scoped (via `eslint.config.mjs`) to production source.
 *
 * @module packages/eslint-plugin-tests/rules/test-attrs-only-divergence
 */

import { propertyName, staticString } from "../util.mjs";

const TEST_MODES = new Set(["test", "testing", "e2e"]);
const COMPARISONS = new Set(["===", "!==", "==", "!="]);
const TEST_FLAG_NAMES = new Set([
  "isTest",
  "isTesting",
  "isTestMode",
  "isE2E",
  "isE2e",
  "IS_TEST",
  "IS_E2E"
]);
const RUNNER_GLOBALS = new Set(["Cypress", "__playwright", "__pwInitScripts"]);

/** The dotted text of a pure member chain, else null. */
function dotted(node) {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MetaProperty")
    return `${node.meta.name}.${node.property.name}`;
  if (node.type === "MemberExpression" && !node.computed) {
    const object = dotted(node.object);
    const property = propertyName(node.property);
    return object && property ? `${object}.${property}` : null;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Production source branches on test mode only through useTestAttrs.",
      recommended: true
    },
    schema: [],
    messages: {
      testModeBranch:
        "`{{what}}` is a test-mode branch in production source. `useTestAttrs` is the only sanctioned test-mode divergence (FE-2865)."
    }
  },

  create(context) {
    function report(node, what) {
      context.report({ node, messageId: "testModeBranch", data: { what } });
    }

    return {
      BinaryExpression(node) {
        if (!COMPARISONS.has(node.operator)) return;
        for (const [side, other] of [
          [node.left, node.right],
          [node.right, node.left]
        ]) {
          const text = dotted(side);
          const value = staticString(other);
          if (
            (text === "process.env.NODE_ENV" ||
              text === "import.meta.env.MODE") &&
            value !== null &&
            TEST_MODES.has(value)
          ) {
            report(node, `${text} ${node.operator} "${value}"`);
            return;
          }
        }
      },
      MemberExpression(node) {
        const text = dotted(node);
        if (text === null) return;
        if (
          /^import\.meta\.env\.VITE_\w*(?:TEST|E2E)\w*$/i.test(text) &&
          node.parent.type !== "MemberExpression"
        ) {
          report(node, text);
        } else if (
          /^(?:window|globalThis|self)\.(\w+)$/.test(text) &&
          RUNNER_GLOBALS.has(propertyName(node.property))
        ) {
          report(node, text);
        } else if (text === "navigator.webdriver") {
          report(node, text);
        }
      },
      Identifier(node) {
        if (!TEST_FLAG_NAMES.has(node.name)) return;
        const parent = node.parent;
        if (
          parent.type === "Property" &&
          parent.key === node &&
          !parent.computed
        )
          return;
        if (
          parent.type === "MemberExpression" &&
          parent.property === node &&
          !parent.computed
        )
          return;
        if (parent.type === "VariableDeclarator" && parent.id === node) return;
        if (
          parent.type === "ImportSpecifier" ||
          parent.type === "ExportSpecifier" ||
          parent.type === "FunctionDeclaration"
        )
          return;
        report(node, node.name);
      }
    };
  }
};
