/**
 * @fileoverview `file-responsibility/barrel-only-reexports` — a module's
 * `index.ts` is its public barrel: curated re-exports and nothing else.
 *
 * In a module `index.ts`, flag:
 *  - any declaration (function, class, variable, type, enum, default export);
 *  - `export *` from a file outside the module folder (a sibling module);
 *  - a named re-export of an `@internal` file, except a `*.mappers.ts` file.
 *
 * `export * from "./x.types"` inside the module stays legal. A named
 * re-export of a mapper stays legal too: a pure wire-to-domain mapper is the
 * one internal kind another module may share (the `contract` module maps its
 * `products` relation with `contract-product`'s mapper), and
 * `@internal/no-cross-module-imports` forbids the deep import, so the barrel
 * is the only legal door. Machine, services and schemas files stay closed.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/barrel-only-reexports
 */

import path from "node:path";
import {
  isBarrelFile,
  isInternalByName,
  isMappersFile,
  moduleDirOf,
  resolveRelative
} from "../util.mjs";

const DECLARATIONS = new Set([
  "FunctionDeclaration",
  "ClassDeclaration",
  "VariableDeclaration",
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSEnumDeclaration",
  "ExportDefaultDeclaration"
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Allow only curated re-exports in a module `index.ts`: no declaration, no `export *` of a sibling module, no re-export of an @internal file other than a mapper."
    },
    schema: [],
    messages: {
      declaration:
        "A module barrel holds re-exports only. Move this declaration into the file whose job it is and re-export it by name.",
      siblingWildcard:
        "Do not `export *` from another module (`{{source}}`). Re-export the names you need from the owning module's barrel.",
      internalReexport:
        "Do not re-export the @internal file `{{source}}` from the barrel. A barrel exposes the public API only."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isBarrelFile(filename)) return {};
    const moduleDir = moduleDirOf(filename);
    if (!moduleDir) return {};

    /** True when `source` resolves to a file inside this module folder. */
    function inModule(source) {
      const target = resolveRelative(filename, source);
      const abs = target ?? path.resolve(path.dirname(filename), source);
      return abs === moduleDir || abs.startsWith(`${moduleDir}/`);
    }

    return {
      Program(program) {
        for (const stmt of program.body) {
          if (DECLARATIONS.has(stmt.type)) {
            context.report({ node: stmt, messageId: "declaration" });
          } else if (
            stmt.type === "ExportNamedDeclaration" &&
            stmt.declaration
          ) {
            context.report({ node: stmt, messageId: "declaration" });
          }
        }
      },
      ExportAllDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string" || !source.startsWith(".")) return;
        if (!inModule(source)) {
          context.report({
            node,
            messageId: "siblingWildcard",
            data: { source }
          });
        }
      },
      ExportNamedDeclaration(node) {
        if (!node.source) return;
        const source = node.source.value;
        const target = resolveRelative(filename, source);
        if (target && isInternalByName(target) && !isMappersFile(target)) {
          context.report({
            node,
            messageId: "internalReexport",
            data: { source }
          });
        }
      }
    };
  }
};
