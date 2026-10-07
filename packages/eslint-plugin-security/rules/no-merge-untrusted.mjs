/**
 * @fileoverview `security/no-merge-untrusted` — no prototype pollution through
 * a deep merge of request input.
 *
 * Flags `merge`, `mergeWith`, `defaultsDeep`, `set`, `setWith` and
 * `Object.assign` when a source argument is request input (`req.body`,
 * `req.query`, `req.params`, an `event.body`, `route.query`, `route.params`,
 * `JSON.parse(...)`, `readBody(...)`, `getQuery(...)`). Also flags
 * `obj[key] = ...` inside a `for...in` / `for...of` loop over such input.
 *
 * Valid:   `merge({}, defaults, pick(req.body, ["name"]))`
 * Invalid: `merge({}, req.body)`, `Object.assign(target, JSON.parse(raw))`
 *
 * @module packages/eslint-plugin-security/rules/no-merge-untrusted
 */

const MERGERS = new Set([
  "merge",
  "mergeWith",
  "defaultsDeep",
  "set",
  "setWith"
]);
const INPUT_ROOTS = new Set(["req", "request", "event", "route", "ctx"]);
const INPUT_PROPS = new Set(["body", "query", "params"]);
const INPUT_CALLS = new Set(["readBody", "getQuery", "getRouterParams"]);

/** True when the expression is, or reads from, request input. */
function isUntrusted(node) {
  switch (node.type) {
    case "SpreadElement":
      return isUntrusted(node.argument);
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "ChainExpression":
    case "AwaitExpression":
      return isUntrusted(node.expression ?? node.argument);
    case "CallExpression": {
      const callee = node.callee;
      if (callee.type === "Identifier") return INPUT_CALLS.has(callee.name);
      return (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        callee.object.name === "JSON" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "parse"
      );
    }
    case "MemberExpression": {
      if (
        !node.computed &&
        node.property.type === "Identifier" &&
        INPUT_PROPS.has(node.property.name)
      ) {
        return inputRoot(node.object);
      }
      return isUntrusted(node.object);
    }
    default:
      return false;
  }
}

/** True when the member chain starts at a request-like identifier. */
function inputRoot(node) {
  if (node.type === "Identifier") return INPUT_ROOTS.has(node.name);
  if (node.type === "MemberExpression") return inputRoot(node.object);
  if (node.type === "ChainExpression") return inputRoot(node.expression);
  return false;
}

/** The merger name of a call, or null. */
function mergerName(callee) {
  if (callee.type === "Identifier") {
    return MERGERS.has(callee.name) ? callee.name : null;
  }
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    const name = callee.property.name;
    if (
      callee.object.type === "Identifier" &&
      callee.object.name === "Object" &&
      name === "assign"
    ) {
      return "Object.assign";
    }
    return MERGERS.has(name) ? name : null;
  }
  return null;
}

/** The loop variable names a `for...in` / `for...of` declares. */
function loopVariableNames(node) {
  const left = node.left;
  if (left.type === "VariableDeclaration") {
    const id = left.declarations[0]?.id;
    return id?.type === "Identifier" ? [id.name] : [];
  }
  return left.type === "Identifier" ? [left.name] : [];
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow merging request input into an object (prototype pollution)."
    },
    schema: [],
    messages: {
      mergeUntrusted:
        "`{{name}}` with request input can pollute `Object.prototype`. Pick the known keys first (for example `pick(input, [...])`) or validate with a schema.",
      assignInLoop:
        "Assigning `obj[{{key}}]` inside a loop over request input can pollute `Object.prototype`. Allow-list the keys or use a `Map`."
    }
  },

  create(context) {
    const loops = [];

    function checkLoop(node) {
      if (!isUntrusted(node.right)) return;
      loops.push({ node, names: loopVariableNames(node) });
    }

    function leaveLoop(node) {
      if (loops.at(-1)?.node === node) loops.pop();
    }

    return {
      CallExpression(node) {
        const name = mergerName(node.callee);
        if (!name) return;
        // The first argument is the target; the rest are sources.
        if (node.arguments.slice(1).some(isUntrusted)) {
          context.report({ node, messageId: "mergeUntrusted", data: { name } });
        }
      },
      ForInStatement: checkLoop,
      ForOfStatement: checkLoop,
      "ForInStatement:exit": leaveLoop,
      "ForOfStatement:exit": leaveLoop,
      AssignmentExpression(node) {
        const loop = loops.at(-1);
        if (!loop) return;
        const left = node.left;
        if (
          left.type === "MemberExpression" &&
          left.computed &&
          left.property.type === "Identifier" &&
          loop.names.includes(left.property.name)
        ) {
          context.report({
            node,
            messageId: "assignInLoop",
            data: { key: left.property.name }
          });
        }
      }
    };
  }
};
