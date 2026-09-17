/**
 * @fileoverview `file-responsibility/types-in-types-file` — FE-3249 #3.
 *
 * An EXPORTED `type` alias, `interface`, or `enum` must live in a module's
 * `*.types.ts` file, never in a sibling concern file (`*.services.ts`,
 * `*.utils.ts`, an unsuffixed `*.ts`, …). A local, non-exported `type` /
 * `interface` / `enum` is a private implementation detail and stays legal in
 * any `.ts` file.
 *
 * Both export shapes count as exported:
 *   - a declaration-level export — `export type X = …`, `export interface P {}`,
 *     `export enum S {}`;
 *   - a named export of a locally-declared type — `type X = …; export { X }`.
 *
 * Types files (`isTypesFile`) are the correct home, so they are skipped. Test
 * files (`isTestFile`) are never governed.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/types-in-types-file
 */

import { isTypesFile, isTestFile } from "../util.mjs";

/** AST node type → the human word the message uses for the fix. */
const KIND = {
  TSTypeAliasDeclaration: "type",
  TSInterfaceDeclaration: "interface",
  TSEnumDeclaration: "enum"
};

/** The utility types that derive a type from a co-located value. */
const DERIVED_FROM_VALUE = new Set(["ReturnType", "Awaited"]);

/**
 * True for a `type X = ReturnType<typeof fn>` / `type X = Awaited<…>` alias.
 * A composable exports the return type of its own factory. That factory sits
 * in the same file, so the alias cannot move to `*.types.ts`. That move needs
 * an import of the factory, and the import makes a cycle. The alias derives its
 * shape from a value; it is not a hand-written type. So it is exempt.
 */
function isDerivedTypeAlias(node) {
  if (!node || node.type !== "TSTypeAliasDeclaration") return false;
  const ann = node.typeAnnotation;
  if (!ann || ann.type !== "TSTypeReference") return false;
  if (ann.typeName.type !== "Identifier") return false;
  return DERIVED_FROM_VALUE.has(ann.typeName.name);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an exported type alias, interface or enum to be declared in the module's `*.types.ts` file (FE-3249 #3).",
      recommended: true
    },
    schema: [],
    messages: {
      typeOutsideTypesFile:
        "Move this exported {{kind}} into the module's `*.types.ts` file. An exported type, interface or enum belongs in a types file, not in `{{basename}}`."
    }
  },

  create(context) {
    const filename = context.filename;
    // A types file is the correct home; a test file is never governed.
    if (isTypesFile(filename) || isTestFile(filename)) return {};

    const basename = filename.split("/").pop();

    /** name → the local type-like declaration node it names. */
    const localTypeDecls = new Map();
    /** named-export specifiers with no source and no inline declaration. */
    const pendingLocalExports = [];

    return {
      // Declaration-level export: `export type/interface/enum …`.
      "ExportNamedDeclaration > TSTypeAliasDeclaration, ExportNamedDeclaration > TSInterfaceDeclaration, ExportNamedDeclaration > TSEnumDeclaration"(
        node
      ) {
        if (isDerivedTypeAlias(node)) return; // co-located derived type — exempt
        context.report({
          node,
          messageId: "typeOutsideTypesFile",
          data: { kind: KIND[node.type], basename }
        });
      },

      // Record every type-like declaration by name (order-independent).
      "TSTypeAliasDeclaration, TSInterfaceDeclaration, TSEnumDeclaration"(node) {
        if (node.id && node.id.type === "Identifier") {
          localTypeDecls.set(node.id.name, node);
        }
      },

      // A local named export: `export { X }` — no `from`, no inline declaration.
      ExportNamedDeclaration(node) {
        if (node.source || node.declaration) return; // re-export / handled above
        for (const spec of node.specifiers) {
          if (spec.local && spec.local.type === "Identifier") {
            pendingLocalExports.push(spec);
          }
        }
      },

      // Resolve local named exports once the whole file is parsed, so a
      // hoisted `export { X }` before `type X = …` is still caught.
      "Program:exit"() {
        for (const spec of pendingLocalExports) {
          const decl = localTypeDecls.get(spec.local.name);
          if (decl && !isDerivedTypeAlias(decl)) {
            context.report({
              node: spec,
              messageId: "typeOutsideTypesFile",
              data: { kind: KIND[decl.type], basename }
            });
          }
        }
      }
    };
  }
};
