/**
 * @fileoverview Shared helpers for the file-responsibility rules (FE-3249).
 * @module packages/eslint-plugin-file-responsibility/util
 */

/** A `*.services.ts` or an actor variant `*.services.<actor>.ts`. */
export function isServicesFile(filename) {
  return /\.services(\.[A-Za-z0-9-]+)*\.ts$/.test(filename);
}

/** A `*.schemas.ts` (or actor variant). */
export function isSchemasFile(filename) {
  return /\.schemas(\.[A-Za-z0-9-]+)*\.ts$/.test(filename);
}

/** A `*.mappers.ts` (or actor variant). */
export function isMappersFile(filename) {
  return /\.mappers(\.[A-Za-z0-9-]+)*\.ts$/.test(filename);
}

/** A `*.types.ts`, an actor variant, or a bare `types.ts`. */
export function isTypesFile(filename) {
  return /(^|[./])types(\.[A-Za-z0-9-]+)*\.ts$/.test(filename);
}

/** Any `.test.` / `.spec.` / fixtures / `.no-test.` file — never governed. */
export function isTestFile(filename) {
  return /\.(test|spec|int\.test|no-test)\.[cm]?tsx?$|__tests__\/|\.fixtures\.ts$/.test(
    filename
  );
}

/** The declared type name of a parameter, or null. `context: AuthContext` → "AuthContext". */
function paramTypeName(param) {
  const ref = param?.typeAnnotation?.typeAnnotation;
  if (ref?.type === "TSTypeReference" && ref.typeName?.type === "Identifier") {
    return ref.typeName.name;
  }
  return null;
}

/** True when a first parameter is the machine context. */
function isContextParam(param) {
  if (!param) return false;
  // `context` / `_context`, however typed.
  if (param.type === "Identifier" && /^_?context$/.test(param.name)) return true;
  // The `fn({ context, event })` shape — a `context` property in the destructure.
  if (param.type === "ObjectPattern") {
    if (
      param.properties.some(
        (p) =>
          p.type === "Property" &&
          p.key?.type === "Identifier" &&
          /^_?context$/.test(p.key.name)
      )
    ) {
      return true;
    }
  }
  // Typed as a `*Context` — `context: AuthContext`, or `{ model }: ClientContext`
  // (the context destructured into its own fields).
  const typeName = paramTypeName(param);
  if (typeName && typeName.endsWith("Context")) return true;
  return false;
}

/**
 * The XState machine-service signature: an async function invoked by a machine
 * as `(context, event)`, recognised by its FIRST parameter being the context.
 * This is the universal carve-out that keeps a legitimate non-request service
 * function (and a `parse(context, event)`) in a services file. The context
 * parameter takes any of the shapes the codebase uses:
 *
 *   - the identifier `context` / `_context` (an unused param is `_`-prefixed);
 *   - the `fn({ context, event })` destructure — a `context` property;
 *   - a `*Context` type — `context: AuthContext`, or the context destructured
 *     into its own fields, `{ model }: ClientContext`.
 *
 * A plain data util (`formatName(s)`, `resolveFilterSlots(rows)`) has no such
 * first parameter, so it stays governed. Pass the function node
 * (FunctionDeclaration | ArrowFunctionExpression | FunctionExpression).
 */
export function isMachineServiceFn(fnNode) {
  if (!fnNode || !fnNode.async) return false;
  return isContextParam(fnNode.params?.[0]);
}

/** Unwrap a `const x = <fn>` / `export const x = <fn>` initialiser to its function node, or return the node itself if already a function. */
export function asFunctionNode(node) {
  if (!node) return null;
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression"
  ) {
    return node;
  }
  return null;
}
