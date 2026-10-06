/**
 * @fileoverview Shared helpers for the xstate rules.
 * @module packages/eslint-plugin-xstate/util
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** True when the program imports from `xstate` or an `@xstate/*` package. */
export function importsXstate(program) {
  return program.body.some(
    node =>
      node.type === "ImportDeclaration" &&
      typeof node.source.value === "string" &&
      (node.source.value === "xstate" ||
        node.source.value.startsWith("xstate/") ||
        node.source.value.startsWith("@xstate/"))
  );
}

/** A `*.machine.ts` or `*.machine.<context>.ts` file name. */
export function isMachineFile(filename) {
  return /\.machine(\.[A-Za-z0-9-]+)*\.[cm]?ts$/.test(filename);
}

/** Any test, spec, fixture or `__tests__` file. */
export function isTestFile(filename) {
  return /\.(test|spec|int\.test|no-test)\.[cm]?tsx?$|__tests__\/|\.fixtures\.ts$/.test(
    filename
  );
}

/** The simple name of a callee: `createMachine(...)` and `x.createMachine(...)`. */
export function calleeName(call) {
  const callee = call.callee;
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

/** True for `createMachine(...)` (bare) or `setup(...).createMachine(...)`. */
export function isCreateMachineCall(node) {
  return node.type === "CallExpression" && calleeName(node) === "createMachine";
}

/** True for the `setup(...).createMachine(...)` form only. */
export function isSetupCreateMachine(node) {
  return (
    isCreateMachineCall(node) &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "CallExpression" &&
    calleeName(node.callee.object) === "setup"
  );
}

/** The property name of a Property node (identifier or string literal key). */
export function propertyName(property) {
  if (property.type !== "Property" || property.computed) return null;
  if (property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "Literal") return String(property.key.value);
  return null;
}

/** The ObjectExpression property named `name`, or null. */
export function findProperty(objectNode, name) {
  if (!objectNode || objectNode.type !== "ObjectExpression") return null;
  return (
    objectNode.properties.find(property => propertyName(property) === name) ??
    null
  );
}

const majorCache = new Map();

/**
 * The installed major version of `xstate` as seen from `filename`, or null when
 * it cannot be resolved. `override` (a number) wins, so tests can pin a major.
 */
export function installedXstateMajor(filename, override) {
  if (typeof override === "number") return override;
  let dir = dirname(filename);
  const seen = [];
  for (;;) {
    if (majorCache.has(dir)) {
      const cached = majorCache.get(dir);
      for (const entry of seen) majorCache.set(entry, cached);
      return cached;
    }
    seen.push(dir);
    const candidate = join(dir, "node_modules", "xstate", "package.json");
    if (existsSync(candidate)) {
      const major = Number.parseInt(
        JSON.parse(readFileSync(candidate, "utf8")).version,
        10
      );
      for (const entry of seen) majorCache.set(entry, major);
      return major;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      for (const entry of seen) majorCache.set(entry, null);
      return null;
    }
    dir = parent;
  }
}

/** The option `xstateMajor` schema fragment shared by the v5-only rules. */
export const xstateMajorSchema = {
  type: "object",
  properties: { xstateMajor: { type: "integer" } },
  additionalProperties: false
};

/** True when the v5-only rule should stay silent for this file. */
export function belowV5(context) {
  const option = context.options[0]?.xstateMajor;
  const major = installedXstateMajor(context.filename, option);
  return major === null || major < 5;
}
