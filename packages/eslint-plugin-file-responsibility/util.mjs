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

/**
 * The XState machine-service signature: an async function whose FIRST parameter
 * is `context` — either the identifier `context` (`fn(context, event)`) or a
 * destructured `{ context }` (`fn({ context, event })`). This is the shape a
 * machine invokes, and it is the universal carve-out that keeps a legitimate
 * non-request service function (and a `parse(context, event)`) in a services
 * file. Pass the function node (FunctionDeclaration | ArrowFunctionExpression |
 * FunctionExpression).
 */
export function isMachineServiceFn(fnNode) {
  if (!fnNode || !fnNode.async) return false;
  const first = fnNode.params?.[0];
  if (!first) return false;
  if (first.type === "Identifier") return first.name === "context";
  if (first.type === "ObjectPattern") {
    return first.properties.some(
      (p) =>
        p.type === "Property" &&
        p.key?.type === "Identifier" &&
        p.key.name === "context"
    );
  }
  // A typed param arrives as the identifier with a typeAnnotation; still an Identifier above.
  return false;
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
