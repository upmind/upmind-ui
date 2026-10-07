/**
 * @fileoverview `xstate/event-case` — event types are SCREAMING_SNAKE_CASE.
 *
 * An event type in an `on:` key or in `send`/`raise`/`sendTo`/`sendParent`
 * must match `^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*)*$`. The dotted form
 * (`SET.QUANTITY`) stays legal. The `*` wildcard and the built-in
 * `xstate.*`, `done.*` and `error.*` events are exempt.
 *
 * Valid:   `on: { SET_QUANTITY: "x", "SET.QUANTITY": "y" }`
 * Invalid: `on: { setQuantity: "x" }`, `send({ type: "setQuantity" })`
 *
 * @module packages/eslint-plugin-xstate/rules/event-case
 */

import {
  calleeName,
  findProperty,
  importsXstate,
  propertyName
} from "../util.mjs";

const EVENT_PATTERN = /^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*)*$/;
const BUILT_IN = /^(\*|xstate\.|done\.|error\.)/;
const SENDERS = new Set(["send", "raise", "sendTo", "sendParent"]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require XState event types to be SCREAMING_SNAKE_CASE (dotted form allowed)."
    },
    schema: [],
    messages: {
      eventCase:
        "Event type `{{type}}` must be SCREAMING_SNAKE_CASE (for example `SET_QUANTITY`; the dotted form `SET.QUANTITY` is allowed)."
    }
  },

  create(context) {
    if (!importsXstate(context.sourceCode.ast)) return {};

    function check(node, type) {
      if (type === "" || BUILT_IN.test(type) || EVENT_PATTERN.test(type))
        return;
      context.report({ node, messageId: "eventCase", data: { type } });
    }

    function checkSendArgument(argument) {
      if (!argument) return;
      if (argument.type === "Literal" && typeof argument.value === "string") {
        check(argument, argument.value);
      } else if (argument.type === "ObjectExpression") {
        const type = findProperty(argument, "type");
        if (
          type?.value.type === "Literal" &&
          typeof type.value.value === "string"
        ) {
          check(type.value, type.value.value);
        }
      }
    }

    return {
      Property(node) {
        if (propertyName(node) !== "on") return;
        if (node.value.type !== "ObjectExpression") return;
        for (const transition of node.value.properties) {
          const name = propertyName(transition);
          if (name !== null) check(transition.key, name);
        }
      },
      CallExpression(node) {
        const name = calleeName(node);
        if (!name || !SENDERS.has(name)) return;
        // sendTo(target, event): the event is the second argument.
        checkSendArgument(
          name === "sendTo" ? node.arguments[1] : node.arguments[0]
        );
      }
    };
  }
};
