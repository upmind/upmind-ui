/**
 * @fileoverview `ui/module-anatomy` — the UI module anatomy (decision 12).
 *
 * On `packages/modules-*\/src/**`, `src/` holds only `index.ts`, `types.ts`,
 * `variants.ts`, `styles.css`, `components/`, optional `renderers/`,
 * `*.utils.ts`, and `__tests__/`. A top-level file or folder outside that set
 * fails, and so does a `*.styles.ts` or `<name>.variants.ts` file anywhere.
 * `modules-foundation` is split by feature: its first folder is a feature
 * folder that repeats the anatomy (option `featurePackages`).
 *
 * Valid:   `src/index.ts`, `src/components/Card.vue`, `src/card.utils.ts`
 * Invalid: `src/helpers.ts`, `src/hooks/useX.ts`, `src/card.styles.ts`
 *
 * @module packages/eslint-plugin-ui/rules/module-anatomy
 */

const ANATOMY_FILES = new Set(["index.ts", "types.ts", "variants.ts"]);
const ANATOMY_FOLDERS = new Set(["components", "renderers", "__tests__"]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep a modules-* package's src/ to the UI module anatomy; no *.styles.ts or <name>.variants.ts.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          featurePackages: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      outsideAnatomy:
        "`{{path}}` is outside the UI module anatomy. `src/` holds `index.ts`, `types.ts`, `variants.ts`, `styles.css`, `components/`, `renderers/`, `*.utils.ts` and `__tests__/`.",
      styleFile:
        "`{{path}}` is not allowed. Put variants in `variants.ts` and styles in `styles.css`."
    }
  },

  create(context) {
    const match = /\/packages\/(modules-[^/]+)\/src\/(.+)$/.exec(
      context.filename
    );
    if (!match) return {};
    const featurePackages = new Set(
      context.options[0]?.featurePackages ?? ["modules-foundation"]
    );
    const segments = match[2].split("/");
    const file = segments.at(-1);

    return {
      Program(program) {
        const report = messageId =>
          context.report({
            node: program,
            loc: { line: 1, column: 0 },
            messageId,
            data: { path: match[2] }
          });

        if (/\.styles\.[cm]?ts$/.test(file)) return report("styleFile");
        if (/.\.variants\.[cm]?ts$/.test(file)) return report("styleFile");

        let rest = segments;
        if (
          featurePackages.has(match[1]) &&
          rest.length > 1 &&
          !ANATOMY_FOLDERS.has(rest[0])
        ) {
          rest = rest.slice(1);
        }
        if (rest.length === 1) {
          const name = rest[0];
          const allowed =
            ANATOMY_FILES.has(name) || /\.utils\.[cm]?ts$/.test(name);
          if (!allowed) report("outsideAnatomy");
        } else if (!ANATOMY_FOLDERS.has(rest[0])) {
          report("outsideAnatomy");
        }
      }
    };
  }
};
