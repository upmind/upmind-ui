/**
 * @fileoverview `scope-based/machine-service-event-data` — a machine service
 * reads its event payload by destructuring `{ data }`.
 *
 * In a `*.services*.ts` file, flag a read of `event.data` (also `_event.data`
 * and `event?.data`). Write the service as
 * `async ({ token }: Context, { data }: AnyEventObject) => ...`.
 *
 * @module packages/eslint-plugin-scope-based/rules/machine-service-event-data
 */

import { isTestFile } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require a machine service to destructure `{ data }` from its event, not read `event.data`."
    },
    schema: [],
    messages: {
      eventData:
        "Destructure `{ data }` in the event parameter instead of reading `{{name}}.data`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    if (!/\.services(\.[A-Za-z0-9-]+)*\.ts$/.test(filename)) return {};

    return {
      MemberExpression(node) {
        if (node.computed) return;
        if (node.object.type !== "Identifier") return;
        if (node.object.name !== "event" && node.object.name !== "_event") {
          return;
        }
        if (
          node.property.type !== "Identifier" ||
          node.property.name !== "data"
        ) {
          return;
        }
        context.report({
          node,
          messageId: "eventData",
          data: { name: node.object.name }
        });
      }
    };
  }
};
