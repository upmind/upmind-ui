/**
 * @fileoverview `xstate/machine-factory` (XState 5 only) — an exported machine
 * is built by a factory function.
 *
 * A module-level `createMachine(...)` that is exported directly (not inside a
 * function) fails. The rule reads the installed `xstate` major and stays
 * silent below 5. The option `xstateMajor` pins the major for tests.
 *
 * Valid:   `export const makeMachine = () => createMachine({})`
 * Invalid: `export const machine = createMachine({})`
 *
 * @module packages/eslint-plugin-xstate/rules/machine-factory
 */

import { belowV5, isCreateMachineCall, xstateMajorSchema } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "XState 5 only: require an exported machine to be created inside a factory function."
    },
    schema: [xstateMajorSchema],
    messages: {
      machineFactory:
        "Do not export a module-level machine. Export a factory function that returns `createMachine(...)`."
    }
  },

  create(context) {
    if (belowV5(context)) return {};
    // Module-level `const m = createMachine(...)` bindings, by name, so a later
    // `export { m }` or `export default m` is still caught.
    const moduleMachines = new Map();
    const report = node =>
      context.report({ node, messageId: "machineFactory" });

    return {
      Program(program) {
        for (const statement of program.body) {
          if (statement.type !== "VariableDeclaration") continue;
          for (const declarator of statement.declarations) {
            if (
              declarator.id.type === "Identifier" &&
              declarator.init &&
              isCreateMachineCall(declarator.init)
            ) {
              moduleMachines.set(declarator.id.name, declarator.init);
            }
          }
        }
      },
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (declaration?.type === "VariableDeclaration") {
          for (const declarator of declaration.declarations) {
            if (declarator.init && isCreateMachineCall(declarator.init)) {
              report(declarator.init);
            }
          }
          return;
        }
        if (node.source) return;
        for (const specifier of node.specifiers) {
          const machine = moduleMachines.get(specifier.local.name);
          if (machine && !declaration) report(specifier);
        }
      },
      ExportDefaultDeclaration(node) {
        const declaration = node.declaration;
        if (isCreateMachineCall(declaration)) {
          report(declaration);
        } else if (
          declaration.type === "Identifier" &&
          moduleMachines.has(declaration.name)
        ) {
          report(declaration);
        }
      }
    };
  }
};
