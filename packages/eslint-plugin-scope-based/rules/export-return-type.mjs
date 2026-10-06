/**
 * @fileoverview `scope-based/export-return-type` — every composable and layer
 * factory exports its return type.
 *
 * In a `use*.ts` file, each exported `use<Module>` and each exported
 * `create<Module><Layer>` (`Actions`, `Context`, `Meta`, `Internals`) needs an
 * exported alias `type X = ReturnType<typeof name>` in the same file.
 *
 * @module packages/eslint-plugin-scope-based/rules/export-return-type
 */

import { composableFile, isTestFile } from "../util.mjs";

const FACTORY_NAME =
  /^(use[A-Z]\w*|create[A-Z]\w*(Actions|Context|Meta|Internals))$/;

/** `ReturnType<typeof name>` -> name, else null. */
function returnTypeTarget(typeNode) {
  if (
    typeNode?.type !== "TSTypeReference" ||
    typeNode.typeName.type !== "Identifier" ||
    typeNode.typeName.name !== "ReturnType"
  ) {
    return null;
  }
  const arg = (typeNode.typeArguments ?? typeNode.typeParameters)?.params?.[0];
  if (arg?.type !== "TSTypeQuery" || arg.exprName.type !== "Identifier") {
    return null;
  }
  return arg.exprName.name;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an exported `ReturnType<typeof factory>` alias beside each exported composable and layer factory."
    },
    schema: [],
    messages: {
      missingReturnType:
        "Export the return type of `{{name}}`: `export type <Name> = ReturnType<typeof {{name}}>`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};

    const factories = [];
    const aliased = new Set();

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl) return;
        if (decl.type === "FunctionDeclaration" && decl.id) {
          if (FACTORY_NAME.test(decl.id.name)) {
            factories.push({ name: decl.id.name, node: decl.id });
          }
        } else if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) {
            if (d.id.type === "Identifier" && FACTORY_NAME.test(d.id.name)) {
              factories.push({ name: d.id.name, node: d.id });
            }
          }
        } else if (decl.type === "TSTypeAliasDeclaration") {
          const target = returnTypeTarget(decl.typeAnnotation);
          if (target) aliased.add(target);
        }
      },
      "Program:exit"() {
        for (const factory of factories) {
          if (aliased.has(factory.name)) continue;
          context.report({
            node: factory.node,
            messageId: "missingReturnType",
            data: { name: factory.name }
          });
        }
      }
    };
  }
};
