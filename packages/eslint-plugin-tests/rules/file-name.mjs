/**
 * @fileoverview `tests/file-name` — a test file name is
 * `<source-base>[.<actor>].<layer>.test.ts`, where the actor is `client`,
 * `staff` or `guest` (code-tests §Naming by actor). The name says which code
 * the test covers and at which layer. A parity-matrix label such as `cell-a`
 * is design-doc vocabulary and never a file name.
 *
 * @module packages/eslint-plugin-tests/rules/file-name
 */

import { basenameOf } from "../util.mjs";

const TEST_SUFFIX = /\.test\.(?:ts|tsx|mts|cts)$/;
const MATRIX_LABEL = /^cell(?:-[a-z0-9]+)?$/;
/** The test layers: unit, integration, e2e and UI component tests. */
const LAYERS = new Set(["unit", "int", "e2e", "ui"]);
/**
 * A role word in the actor slot. The only actors are `client`, `staff` and
 * `guest`, so any other role name there is a wrong actor.
 */
const NON_ACTOR_ROLES = new Set([
  "admin",
  "customer",
  "user",
  "anonymous",
  "visitor",
  "owner",
  "member",
  "agent",
  "org",
  "self"
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A test file is named <source-base>[.<actor>].<layer>.test.ts with actor client, staff or guest.",
      recommended: true
    },
    schema: [],
    messages: {
      noLayer:
        "`{{name}}` has no layer. Name a test file `<source-base>[.<actor>].<layer>.test.ts`, for example `{{example}}`. The actor is `client`, `staff` or `guest`.",
      matrixLabel:
        "`{{name}}` carries the matrix label `{{label}}`. Name the concrete actor (`client`, `staff` or `guest`), not a matrix cell."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const name = basenameOf(filename);
    if (!TEST_SUFFIX.test(name)) return {};

    return {
      Program(program) {
        const segments = name.replace(TEST_SUFFIX, "").split(".");
        const label = segments.find(segment => MATRIX_LABEL.test(segment));
        if (label) {
          context.report({
            node: program,
            loc: { line: 1, column: 0 },
            messageId: "matrixLabel",
            data: { name, label }
          });
          return;
        }
        const layer = segments[segments.length - 1];
        const actorSlot =
          segments.length >= 3 ? segments[segments.length - 2] : null;
        if (
          segments.length < 2 ||
          !LAYERS.has(layer) ||
          (actorSlot !== null && NON_ACTOR_ROLES.has(actorSlot))
        ) {
          context.report({
            node: program,
            loc: { line: 1, column: 0 },
            messageId: "noLayer",
            data: {
              name,
              example: `${segments[0]}.unit.test.ts`
            }
          });
        }
      }
    };
  }
};
