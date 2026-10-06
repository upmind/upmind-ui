/**
 * @fileoverview `scope-based/file-names` — module file names say the file's job.
 *
 * For a file directly inside a module folder:
 *  - a composable file is `use<Module>.ts` or `use<Module>.<layer>[.<actor>].ts`
 *    (layer: actions, context, meta, internals; actor: client, staff, guest);
 *  - any other file is `<module>.<purpose>[.<context>].ts`, or `index.ts`;
 *  - a `.base` file is never allowed: shared code lives in the factory file.
 *
 * A file in a sub-folder (`__tests__`, `docs`) is not checked.
 *
 * @module packages/eslint-plugin-scope-based/rules/file-names
 */

import { basenameOf, isTestFile, moduleDirOf } from "../util.mjs";

const COMPOSABLE =
  /^use[A-Z][A-Za-z0-9_]*(\.(actions|context|meta|internals)(\.(client|staff|guest))?)?\.ts$/;
const PURPOSE_FILE =
  /^[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9-]+)?\.ts$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require module file names of the form {module}.{purpose}.{context?}.ts or use{Module}.{layer}.{actor?}.ts, and forbid .base files."
    },
    schema: [],
    messages: {
      noBase:
        "Do not create a `.base` file. Shared code lives in the factory file (`use<Module>.<layer>.ts`).",
      badName:
        "Name `{{name}}` as `{module}.{purpose}.{context?}.ts` or `use{Module}.{layer}.{actor?}.ts`."
    }
  },

  create(context) {
    const filename = (context.filename ?? context.getFilename()).replace(
      /\\/g,
      "/"
    );
    if (isTestFile(filename)) return {};
    const moduleDir = moduleDirOf(filename);
    if (!moduleDir) return {};
    // Direct children of the module folder only.
    if (filename.slice(moduleDir.length + 1).includes("/")) return {};
    const name = basenameOf(filename);
    if (name === "index.ts") return {};

    return {
      Program(node) {
        if (/\.base(\.|$)/.test(name)) {
          context.report({
            node,
            messageId: "noBase",
            loc: { line: 1, column: 0 }
          });
          return;
        }
        if (COMPOSABLE.test(name) || PURPOSE_FILE.test(name)) return;
        context.report({
          node,
          messageId: "badName",
          loc: { line: 1, column: 0 },
          data: { name }
        });
      }
    };
  }
};
