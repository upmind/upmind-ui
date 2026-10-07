/**
 * @fileoverview `tests/e2e-no-spec-retries` — a spec never sets or reads its
 * own retries (P7). The config sets retries once, and a flake is quarantined,
 * not retried (ADR 021).
 *
 * Flags `retries` inside `test.describe.configure({ ... })` or
 * `test.use({ ... })`, and any read of `testInfo.retry` / `test.info().retry`.
 * In `playwright.config.*` the rule holds a numeric `retries` at 1 or less.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-no-spec-retries
 */

import { basenameOf, objectProperty, propertyName } from "../util.mjs";

const MAX_CONFIG_RETRIES = 1;

function isInfoCall(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    propertyName(node.callee.property) === "info"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "No retries in a spec, and at most one retry in playwright.config.",
      recommended: true
    },
    schema: [],
    messages: {
      specRetries:
        "A spec sets no `retries`. The config sets retries once; quarantine a flaky test instead.",
      retryBranch:
        "A spec does not branch on the retry count. The config sets retries once; quarantine a flaky test instead.",
      configRetries:
        "`retries` is {{value}}. Hold `retries` at {{max}} or less in the config."
    }
  },

  create(context) {
    const isConfig = /^playwright(?:\.[\w-]+)?\.config\.[cm]?[jt]s$/.test(
      basenameOf(context.filename ?? context.getFilename())
    );

    if (isConfig) {
      return {
        Property(node) {
          if (
            !node.computed &&
            propertyName(node.key) === "retries" &&
            node.value.type === "Literal" &&
            typeof node.value.value === "number" &&
            node.value.value > MAX_CONFIG_RETRIES
          ) {
            context.report({
              node,
              messageId: "configRetries",
              data: { value: node.value.value, max: MAX_CONFIG_RETRIES }
            });
          }
        }
      };
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        const method = propertyName(callee.property);
        if (method !== "configure" && method !== "use") return;
        const retries = objectProperty(node.arguments[0], "retries");
        if (retries)
          context.report({ node: retries, messageId: "specRetries" });
      },
      MemberExpression(node) {
        if (node.computed || propertyName(node.property) !== "retry") return;
        const object = node.object;
        if (
          (object.type === "Identifier" && object.name === "testInfo") ||
          isInfoCall(object)
        ) {
          context.report({ node, messageId: "retryBranch" });
        }
      }
    };
  }
};
