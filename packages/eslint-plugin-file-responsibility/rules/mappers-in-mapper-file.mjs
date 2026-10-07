/**
 * @fileoverview `file-responsibility/mappers-in-mapper-file` — FE-3249 rule #6.
 *
 * A mapper lives in a `*.mappers.ts` file. An EXPORTED function whose name
 * starts with `map` or `parse` (prefix `^(map|parse)` — `mapUser`, `parseTerm`,
 * `map`, `parse`, and even the nouns `mapping` / `parser` all match) must
 * therefore not be declared in any other file.
 *
 * THE ONE EXCEPTION: an XState machine-service function in a SERVICES file. A
 * machine invokes `async parse(context, event)`; that genuine service stays put.
 * So a `map*` / `parse*` function is NOT flagged when the file is a services
 * file AND the function has the machine-service signature (`isMachineServiceFn`).
 *
 * Covers `export function map*(){}` / `export function parse*(){}` and
 * `export const map* = () => {}`. Test files are never governed.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/mappers-in-mapper-file
 */

import {
  asFunctionNode,
  isMachineServiceFn,
  isMappersFile,
  isServicesFile,
  isTestFile
} from "../util.mjs";

/** True for an exported function name that must live in a mappers file. */
function isMapperName(name) {
  return /^(map|parse)/.test(name);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require exported `map*` / `parse*` functions to live in a `*.mappers.ts` file (FE-3249 #6), except a machine-service function in a services file.",
      recommended: true
    },
    schema: [],
    messages: {
      mapperOutsideMapperFile:
        "Exported `{{name}}` starts with `map`/`parse`, so it is a mapper and must live in a `*.mappers.ts` file. Move `{{name}}` to the module's `*.mappers.ts` file."
    }
  },

  create(context) {
    const filename = context.filename;
    // A mappers file is the correct home; test files are never governed.
    if (isTestFile(filename) || isMappersFile(filename)) return {};
    const inServices = isServicesFile(filename);

    const check = (idNode, fnNode) => {
      if (!idNode || idNode.type !== "Identifier") return;
      if (!isMapperName(idNode.name)) return;
      // The carve-out: a genuine machine-service `parse(context, event)` in a
      // services file is invoked by the machine, so it stays put.
      if (inServices && isMachineServiceFn(fnNode)) return;
      context.report({
        node: idNode,
        messageId: "mapperOutsideMapperFile",
        data: { name: idNode.name }
      });
    };

    /** name → the mapper-named local function it declares. */
    const localMapperFns = new Map();
    /** `export { x }` specifiers with no source and no inline declaration. */
    const pendingLocalExports = [];

    return {
      // `export function map*(){}` / `export const map* = () => {}`
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl) {
          // A local named export: `export { parseX }` — no `from`. Resolve at
          // Program:exit so a hoisted export before its declaration is caught.
          if (node.source) return; // re-export — the binding lives elsewhere.
          for (const spec of node.specifiers) {
            if (spec.local?.type === "Identifier")
              pendingLocalExports.push(spec);
          }
          return;
        }
        if (decl.type === "FunctionDeclaration") {
          check(decl.id, decl);
        } else if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) {
            const fn = asFunctionNode(d.init);
            if (!fn) continue; // only exported functions are governed.
            check(d.id, fn);
          }
        }
      },

      // Record every mapper-named local function, order-independent, with its
      // function node so the machine-service carve-out still applies.
      "FunctionDeclaration, VariableDeclarator"(node) {
        const id = node.id;
        if (id?.type !== "Identifier" || !isMapperName(id.name)) return;
        const fn =
          node.type === "FunctionDeclaration"
            ? node
            : asFunctionNode(node.init);
        if (fn) localMapperFns.set(id.name, fn);
      },

      "Program:exit"() {
        for (const spec of pendingLocalExports) {
          const fn = localMapperFns.get(spec.local.name);
          if (fn) check(spec.local, fn);
        }
      }
    };
  }
};
