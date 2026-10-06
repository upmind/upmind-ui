/**
 * @fileoverview `file-responsibility/no-own-barrel-import` — inside a module,
 * import files directly, never the module's own barrel.
 *
 * A file in module X that imports (or re-exports from) X's own `index.ts`
 * creates an import-time cycle. Point at the file that holds the name. The
 * module's own barrel is excluded from the check, because it re-exports its
 * siblings by design.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/no-own-barrel-import
 */

import path from "node:path";
import { isTestFile, moduleDirOf, resolveRelative } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing a module's own `index.ts` barrel from inside the module."
    },
    schema: [],
    messages: {
      ownBarrel:
        "Do not import the module's own barrel (`{{source}}`). Import the file that holds the name; a barrel import inside its module makes an import cycle."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    const moduleDir = moduleDirOf(filename);
    if (!moduleDir) return {};
    const ownBarrel = path.join(moduleDir, "index.ts");
    if (filename === ownBarrel) return {};

    function check(node) {
      const source = node.source?.value;
      if (typeof source !== "string" || !source.startsWith(".")) return;
      if (resolveRelative(filename, source) !== ownBarrel) return;
      context.report({ node, messageId: "ownBarrel", data: { source } });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check
    };
  }
};
