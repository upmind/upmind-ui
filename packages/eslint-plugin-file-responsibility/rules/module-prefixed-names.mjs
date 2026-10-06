/**
 * @fileoverview `file-responsibility/module-prefixed-names` — every file in a
 * headless module directory starts with the module name or `use`.
 *
 * In `packages/headless/src/modules/<module>/`, every file other than
 * `index.ts` starts with `<module>.` or `use`. Files in sub-folders
 * (`__tests__/`, `docs/`) and the `modules-*` layout (decision 12) are out of
 * scope.
 *
 * Valid:   `basket/basket.machine.ts`, `basket/useBasket.ts`, `basket/index.ts`
 * Invalid: `basket/helpers.ts`, `basket/machine.ts`
 *
 * @module packages/eslint-plugin-file-responsibility/rules/module-prefixed-names
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a headless module file to start with `<module>.` or `use`, except index.ts."
    },
    schema: [],
    messages: {
      modulePrefix:
        "`{{file}}` must start with `{{module}}.` or `use`. Rename it, for example `{{module}}.<concern>.ts`."
    }
  },

  create(context) {
    const match = /\/packages\/headless\/src\/modules\/([^/]+)\/([^/]+)$/.exec(
      context.filename
    );
    if (!match) return {};
    const [, module, file] = match;
    if (file === "index.ts") return {};
    if (file.startsWith(`${module}.`) || file.startsWith("use")) return {};
    return {
      Program(program) {
        context.report({
          node: program,
          loc: { line: 1, column: 0 },
          messageId: "modulePrefix",
          data: { file, module }
        });
      }
    };
  }
};
