/**
 * @fileoverview `xstate/bind-subscribe` — a re-exposed `subscribe` is bound.
 *
 * `subscribe` is a method that reads `this`. An object property
 * `subscribe: x.subscribe` without `.bind(x)` loses `this` and breaks at the
 * call site.
 *
 * Valid:   `{ subscribe: actor.subscribe.bind(actor) }`
 * Invalid: `{ subscribe: actor.subscribe }`
 *
 * @module packages/eslint-plugin-xstate/rules/bind-subscribe
 */

import { propertyName } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `subscribe: x.subscribe` in an object to be bound with `.bind(x)`."
    },
    schema: [],
    messages: {
      bindSubscribe:
        "Bind the method: `subscribe: {{object}}.subscribe.bind({{object}})`. An unbound `subscribe` loses `this`."
    }
  },

  create(context) {
    return {
      Property(node) {
        if (propertyName(node) !== "subscribe") return;
        const value = node.value;
        if (
          value.type !== "MemberExpression" ||
          value.computed ||
          value.property.type !== "Identifier" ||
          value.property.name !== "subscribe"
        ) {
          return;
        }
        context.report({
          node,
          messageId: "bindSubscribe",
          data: { object: context.sourceCode.getText(value.object) }
        });
      }
    };
  }
};
