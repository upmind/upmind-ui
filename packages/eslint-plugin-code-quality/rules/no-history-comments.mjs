/**
 * @fileoverview `code-quality/no-history-comments` — a comment states the
 * present, never the history.
 *
 * Flags a comment that holds a tracker id, an ISO date, or a history phrase
 * ("moved here", "previously", "corrected on", "was withdrawn"). Git and the
 * tracker carry history. The tracker-id pattern comes from the rule option
 * `trackerIdPattern` (a regular expression source). The default matches any
 * `ABC-123` shape; set it to the real team keys in the lint config.
 *
 * Lint directive comments (`eslint-disable ...`) are never inspected.
 *
 * @module packages/eslint-plugin-code-quality/rules/no-history-comments
 */

const DEFAULT_TRACKER_ID = "\\b[A-Z]{2,}-\\d+\\b";
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const PHRASES = /\b(moved here|previously|corrected on|was withdrawn)\b/i;
const DIRECTIVE = /^\s*(eslint-|prettier-ignore|@ts-|istanbul |c8 |v8 )/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow tracker ids, ISO dates and history phrases in a comment."
    },
    schema: [
      {
        type: "object",
        properties: { trackerIdPattern: { type: "string" } },
        additionalProperties: false
      }
    ],
    messages: {
      history:
        "A comment states the present, not the history. Remove the {{kind}}; git and the tracker carry it."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const options = context.options[0] ?? {};
    const trackerId = new RegExp(
      options.trackerIdPattern ?? DEFAULT_TRACKER_ID
    );

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (DIRECTIVE.test(comment.value)) continue;
          let kind = null;
          if (trackerId.test(comment.value)) kind = "tracker id";
          else if (ISO_DATE.test(comment.value)) kind = "date";
          else if (PHRASES.test(comment.value)) kind = "history phrase";
          if (!kind) continue;
          context.report({
            loc: comment.loc,
            messageId: "history",
            data: { kind }
          });
        }
      }
    };
  }
};
