/**
 * @fileoverview `file-responsibility/schemas-in-schema-file` — FE-3249 rule #5.
 *
 * A JSONForms schema lives in a `*.schemas.ts` file. An EXPORTED binding whose
 * name ends in `Schema` or `Uischema` (case-sensitive suffix — `useQuerySchema`,
 * `LoginUischema`, `fooSchema` all match) must therefore not be declared in any
 * other file. Declaring one in, say, `auth.services.ts` or `foo.ts` is an error.
 *
 * Covers `export function xSchema(){}`, `export const xSchema = …` and
 * `export const xUischema = …`. A non-exported `const fooSchema` is untouched
 * (a binding is only governed once it is part of a module's public surface),
 * and test files are never governed.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/schemas-in-schema-file
 */

import { isSchemasFile, isTestFile } from "../util.mjs";

/** True for an exported name that must live in a schemas file. */
function isSchemaName(name) {
  return name.endsWith("Schema") || name.endsWith("Uischema");
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require exported `*Schema` / `*Uischema` bindings to live in a `*.schemas.ts` file (FE-3249 #5); JSONForms schemas belong in the schemas file.",
      recommended: true
    },
    schema: [],
    messages: {
      schemaOutsideSchemaFile:
        "Exported `{{name}}` ends in `Schema`/`Uischema`, so it is a JSONForms schema and must live in a `*.schemas.ts` file. Move `{{name}}` to the module's `*.schemas.ts` file."
    }
  },

  create(context) {
    const filename = context.filename;
    // A schemas file is the correct home; test files are never governed.
    if (isTestFile(filename) || isSchemasFile(filename)) return {};

    const check = (idNode) => {
      if (!idNode || idNode.type !== "Identifier") return;
      const name = idNode.name;
      if (isSchemaName(name)) {
        context.report({
          node: idNode,
          messageId: "schemaOutsideSchemaFile",
          data: { name }
        });
      }
    };

    /** Locally-declared schema-named bindings, by name. */
    const localSchemaDecls = new Set();
    /** `export { x }` specifiers with no source and no inline declaration. */
    const pendingLocalExports = [];

    return {
      // `export function xSchema(){}` / `export const xSchema = …`
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl) {
          // A local named export: `export { xSchema }` — no `from`. Resolve at
          // Program:exit so a hoisted export before its declaration is caught.
          if (node.source) return; // re-export — the binding lives elsewhere.
          for (const spec of node.specifiers) {
            if (spec.local?.type === "Identifier") pendingLocalExports.push(spec);
          }
          return;
        }
        if (decl.type === "FunctionDeclaration") {
          check(decl.id);
        } else if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) check(d.id);
        }
      },

      // Record every schema-named local declaration, order-independent.
      "FunctionDeclaration, VariableDeclarator"(node) {
        const id = node.id;
        if (id?.type === "Identifier" && isSchemaName(id.name)) {
          localSchemaDecls.add(id.name);
        }
      },

      "Program:exit"() {
        for (const spec of pendingLocalExports) {
          if (localSchemaDecls.has(spec.local.name)) {
            check(spec.local);
          }
        }
      }
    };
  }
};
