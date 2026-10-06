/**
 * @fileoverview `xstate/canonical-state-read` — read machine state through the
 * canonical utilities.
 *
 * Outside machine files, flag `state.matches(...)`, a `.context` read off a
 * state or snapshot, and `.getSnapshot()` reads. The message names the
 * canonical utilities from the lint config (default for this repo:
 * `stateMatches`, `useContext`, `contextValue`).
 *
 * Valid:   `stateMatches(state, "idle")`, `contextValue(state, "model")`
 * Invalid: `state.matches("idle")`, `state.context.model`, `actor.getSnapshot()`
 *
 * Machine files (`*.machine.ts`), tests and the state utility itself are
 * exempt by file name; scope the rest in the config `files`/`ignores`.
 *
 * @module packages/eslint-plugin-xstate/rules/canonical-state-read
 */

import { isMachineFile, isTestFile } from "../util.mjs";

const DEFAULT_UTILITIES = ["stateMatches", "useContext", "contextValue"];
const STATE_NAME = /(^|[a-z])(state|snapshot)$|^(state|snapshot)/i;

/** The identifier or property name that an expression ends in, or null. */
function trailingName(node) {
  if (node.type === "Identifier") return node.name;
  if (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.property.type === "Identifier"
  ) {
    return node.property.name;
  }
  if (node.type === "ChainExpression") return trailingName(node.expression);
  return null;
}

/** True when the expression is named like a machine state or snapshot. */
function looksLikeState(node) {
  const name = trailingName(node);
  return name !== null && STATE_NAME.test(name);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow state.matches, state.context and getSnapshot reads outside machine files; use the canonical state utilities."
    },
    schema: [
      {
        type: "object",
        properties: {
          utilities: { type: "array", items: { type: "string" }, minItems: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      matches:
        "Do not call `.matches()` on a state. Use the canonical read utilities: {{utilities}}.",
      context:
        "Do not read `.context` off a state. Use the canonical read utilities: {{utilities}}.",
      snapshot:
        "Do not read `.getSnapshot()` directly. Use the canonical read utilities: {{utilities}}."
    }
  },

  create(context) {
    if (isMachineFile(context.filename) || isTestFile(context.filename)) {
      return {};
    }
    const utilities = (context.options[0]?.utilities ?? DEFAULT_UTILITIES)
      .map(name => `\`${name}\``)
      .join(", ");

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier"
        ) {
          return;
        }
        if (callee.property.name === "getSnapshot") {
          context.report({ node, messageId: "snapshot", data: { utilities } });
        } else if (
          callee.property.name === "matches" &&
          looksLikeState(callee.object)
        ) {
          context.report({ node, messageId: "matches", data: { utilities } });
        }
      },
      MemberExpression(node) {
        if (
          node.computed ||
          node.property.type !== "Identifier" ||
          node.property.name !== "context"
        ) {
          return;
        }
        if (looksLikeState(node.object)) {
          context.report({ node, messageId: "context", data: { utilities } });
        }
      }
    };
  }
};
