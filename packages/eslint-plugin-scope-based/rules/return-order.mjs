/**
 * @fileoverview `scope-based/return-order` — the return object of a composable
 * or layer is alphabetised, grouped, and spreads come last.
 *
 * In a `use*.ts` file, for each object a top-level factory returns:
 *  - the keys sort A to Z (case-insensitive) inside each section. A section
 *    starts at a `// --- name` comment; with no such comment the whole object
 *    is one section;
 *  - the named sections run state, context, methods, utils (a section with
 *    another name is not ordered);
 *  - every spread comes after every keyed member.
 *
 * @module packages/eslint-plugin-scope-based/rules/return-order
 */

import {
  composableFile,
  isTestFile,
  onReturnedObjects,
  propertyKeyName
} from "../util.mjs";

const SECTION_ORDER = ["state", "context", "methods", "utils"];

/** The section name a `// --- name` comment before a node starts, or null. */
function sectionStartedBy(sourceCode, node) {
  for (const comment of sourceCode.getCommentsBefore(node)) {
    if (comment.type !== "Line") continue;
    const m = comment.value.match(/^\s*---\s*([A-Za-z]+)/);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require a composable return object to be alphabetised inside each section, sections ordered state, context, methods, utils, spreads last."
    },
    schema: [],
    messages: {
      unsorted:
        "Sort the return members A to Z inside a section: `{{name}}` comes before `{{previous}}`.",
      sectionOrder:
        "Order the sections state, context, methods, utils: `{{name}}` comes before `{{previous}}`.",
      spreadNotLast: "Put every spread after the keyed members."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return onReturnedObjects(objectNode => {
      let previousKey = null;
      let previousSection = null;
      let seenSpread = false;

      for (const prop of objectNode.properties) {
        if (prop.type === "SpreadElement") {
          seenSpread = true;
          continue;
        }
        if (seenSpread) {
          context.report({ node: prop, messageId: "spreadNotLast" });
          return;
        }

        const section = sectionStartedBy(sourceCode, prop);
        if (section) {
          const rank = SECTION_ORDER.indexOf(section);
          if (rank !== -1) {
            const prevRank = SECTION_ORDER.indexOf(previousSection);
            if (previousSection && prevRank !== -1 && rank < prevRank) {
              context.report({
                node: prop,
                messageId: "sectionOrder",
                data: { name: section, previous: previousSection }
              });
              return;
            }
          }
          previousSection = section;
          previousKey = null;
        }

        const key = propertyKeyName(prop);
        if (!key) continue;
        if (
          previousKey !== null &&
          key.toLowerCase() < previousKey.toLowerCase()
        ) {
          context.report({
            node: prop,
            messageId: "unsorted",
            data: { name: key, previous: previousKey }
          });
          return;
        }
        previousKey = key;
      }
    });
  }
};
