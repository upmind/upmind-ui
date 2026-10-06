/**
 * @fileoverview Shared helpers for the `tests` ESLint plugin. Every helper works
 * on real ESTree/typescript-eslint nodes.
 *
 * @module packages/eslint-plugin-tests/util
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const EXPECT_NAMES = new Set(["expect"]);
const TEST_CALLEE_ROOTS = new Set(["it", "test"]);

/** The basename (final path segment) of a file path. */
export function basenameOf(file) {
  return file.slice(file.lastIndexOf("/") + 1);
}

/** The static name of a non-computed member property or string key, else null. */
export function propertyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string")
    return node.value;
  return null;
}

/** The root identifier name of a member/call chain (`a.b().c` gives `a`), else null. */
export function chainRootName(node) {
  let current = node;
  while (current) {
    if (current.type === "Identifier") return current.name;
    if (current.type === "MemberExpression") current = current.object;
    else if (current.type === "CallExpression") current = current.callee;
    else if (current.type === "ChainExpression") current = current.expression;
    else if (current.type === "AwaitExpression") current = current.argument;
    else return null;
  }
  return null;
}

/** True for `it`, `test`, `it.only`, `test.concurrent`, `it.each(rows)` callees. */
export function isTestCallee(callee) {
  if (!callee) return false;
  if (callee.type === "Identifier") return TEST_CALLEE_ROOTS.has(callee.name);
  if (callee.type === "MemberExpression") {
    const property = propertyName(callee.property);
    if (property === "describe" || property === "beforeEach") return false;
    return isTestCallee(callee.object);
  }
  if (callee.type === "CallExpression") return isTestCallee(callee.callee);
  return false;
}

/** The function node that is a test body (the callback of `it`/`test`), or null. */
export function enclosingTestFunction(node) {
  let current = node.parent;
  while (current) {
    if (
      (current.type === "ArrowFunctionExpression" ||
        current.type === "FunctionExpression") &&
      current.parent?.type === "CallExpression" &&
      current.parent.arguments.includes(current) &&
      isTestCallee(current.parent.callee)
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Parse a matcher call such as `expect(x).not.toBe(1)`.
 *
 * @returns {{ matcher: string, negated: boolean, expectCall: object, subject: object | undefined, call: object } | null}
 */
export function parseExpectChain(call) {
  if (call.type !== "CallExpression") return null;
  const callee = call.callee;
  if (callee.type !== "MemberExpression" || callee.computed) return null;
  const matcher = propertyName(callee.property);
  if (!matcher) return null;
  let negated = false;
  let object = callee.object;
  while (object.type === "MemberExpression" && !object.computed) {
    const name = propertyName(object.property);
    if (name === "not") negated = true;
    else if (name !== "resolves" && name !== "rejects") return null;
    object = object.object;
  }
  if (object.type !== "CallExpression") return null;
  const head = object.callee;
  const isExpect =
    (head.type === "Identifier" && EXPECT_NAMES.has(head.name)) ||
    (head.type === "MemberExpression" &&
      head.object.type === "Identifier" &&
      EXPECT_NAMES.has(head.object.name) &&
      ["soft", "poll"].includes(propertyName(head.property)));
  if (!isExpect) return null;
  return {
    matcher,
    negated,
    expectCall: object,
    subject: object.arguments[0],
    call
  };
}

/** Every direct child node, skipping the `parent` back-edge. */
export function childNodesOf(node) {
  const children = [];
  for (const key in node) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item.type === "string") children.push(item);
      }
    } else if (value && typeof value.type === "string") {
      children.push(value);
    }
  }
  return children;
}

/** Visit every node under `root` once (pre-order). */
export function walk(root, visit) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    visit(node);
    const children = childNodesOf(node);
    for (let i = children.length - 1; i >= 0; i -= 1) stack.push(children[i]);
  }
}

/** The static string of a Literal or an expression-free template literal, else null. */
export function staticString(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string")
    return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map(q => q.value.cooked ?? "").join("");
  }
  return null;
}

/** The value node of a named property in an object expression, else undefined. */
export function objectProperty(objectNode, name) {
  if (!objectNode || objectNode.type !== "ObjectExpression") return undefined;
  return objectNode.properties.find(
    p => p.type === "Property" && !p.computed && propertyName(p.key) === name
  );
}

export const DEFAULT_TEST_ID_ATTRIBUTE = "data-testid";

/**
 * The test-id attribute the project sets as `testIdAttribute` in its
 * `playwright.config.ts` (G7), found by walking up from `startDir`. When the
 * config is absent or leaves it unset, Playwright's own default applies.
 */
export function readTestIdAttribute(startDir) {
  let dir = startDir;
  for (;;) {
    for (const name of ["playwright.config.ts", "playwright.config.mts"]) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) {
        const match = readFileSync(candidate, "utf8").match(
          /testIdAttribute\s*:\s*["'`]([^"'`]+)["'`]/
        );
        return match ? match[1] : DEFAULT_TEST_ID_ATTRIBUTE;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return DEFAULT_TEST_ID_ATTRIBUTE;
    dir = parent;
  }
}
