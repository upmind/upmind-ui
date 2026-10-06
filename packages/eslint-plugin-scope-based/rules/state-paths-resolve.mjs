/**
 * @fileoverview `scope-based/state-paths-resolve` — a state or context path
 * names something the machine has.
 *
 * In a `use*.ts` file of a module that has a `*.machine.ts`, each string path
 * given to `stateMatches(state, path)`, `state.matches(path)` (a string, or an
 * array of strings) must have every dotted segment present as a property name
 * in the machine files of the modules folder (a composable may cite a child
 * machine another module owns); the first segment of a `contextValue(state,
 * "path")` must be a property name there too. A `waitFor` condition holds its
 * own `stateMatches` call, so it is covered through that call.
 *
 * The check is by name, not by tree position: it catches a renamed or removed
 * node that a composable still cites. It does not prove the nesting.
 *
 * @module packages/eslint-plugin-scope-based/rules/state-paths-resolve
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { composableFile, isTestFile, moduleDirOf } from "../util.mjs";

const MACHINE_FILE = /\.machine(\.[A-Za-z0-9-]+)*\.ts$/;

/** modulesRoot -> Set of property names across every module's machine files. */
const namesCache = new Map();

/**
 * Property names used in the machine files of the modules folder. A composable
 * cites the states of a child machine another module owns (`basket` reads a
 * `billing` state), so the set spans the whole folder, not one module.
 */
function machineNames(modulesRoot) {
  const cached = namesCache.get(modulesRoot);
  if (cached) return cached;
  const names = new Set();
  for (const entry of readdirSync(modulesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(modulesRoot, entry.name);
    for (const file of readdirSync(dir).filter(f => MACHINE_FILE.test(f))) {
      const text = readFileSync(join(dir, file), "utf8");
      for (const m of text.matchAll(
        /(?:^|[\s,{(])["']?([A-Za-z_$][\w$-]*)["']?\s*:/g
      )) {
        names.add(m[1]);
      }
    }
  }
  namesCache.set(modulesRoot, names);
  return names;
}

/** True when the module folder holds a machine file. */
function hasMachine(moduleDir) {
  return (
    existsSync(moduleDir) &&
    readdirSync(moduleDir).some(f => MACHINE_FILE.test(f))
  );
}

/** String literals in an argument: one string, or an array of strings. */
function stringPaths(arg) {
  if (!arg) return [];
  if (arg.type === "Literal" && typeof arg.value === "string") return [arg];
  if (arg.type === "ArrayExpression") {
    return arg.elements.filter(
      e => e?.type === "Literal" && typeof e.value === "string"
    );
  }
  return [];
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require each state or context path cited in a composable to exist as a name in the module's machine."
    },
    schema: [],
    messages: {
      unknownPath:
        "`{{segment}}` in the path `{{path}}` is not a state or context name in this module's machine. Update the path after a machine change."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};
    const moduleDir = moduleDirOf(filename);
    if (!moduleDir) return {};
    if (!hasMachine(moduleDir)) return {};
    const names = machineNames(dirname(moduleDir));

    function check(literal, firstSegmentOnly) {
      const path = literal.value;
      const segments = path.split(".");
      const toCheck = firstSegmentOnly ? segments.slice(0, 1) : segments;
      for (const segment of toCheck) {
        if (segment === "" || names.has(segment)) continue;
        context.report({
          node: literal,
          messageId: "unknownPath",
          data: { segment, path }
        });
        return;
      }
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier") {
          if (callee.name === "stateMatches") {
            for (const lit of stringPaths(node.arguments[1])) check(lit, false);
          } else if (callee.name === "contextValue") {
            for (const lit of stringPaths(node.arguments[1])) check(lit, true);
          }
        } else if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          callee.property.name === "matches" &&
          callee.object.type === "Identifier" &&
          /^state$/i.test(callee.object.name)
        ) {
          for (const lit of stringPaths(node.arguments[0])) check(lit, false);
        }
      }
    };
  }
};
