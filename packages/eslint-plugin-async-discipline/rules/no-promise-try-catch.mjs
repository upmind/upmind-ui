/**
 * async-discipline/no-promise-try-catch — never wrap an `await` in try/catch.
 *
 * A promise is chainable and already exposes .catch()/.then()/.finally(); wrapping
 * an await in try/catch throws that away for an antiquated pattern. Make the
 * rejection a VALUE: `const x = await thing().catch(() => null)`, then branch.
 *
 * AST-ONLY, deliberately narrowed. It detects the `AwaitExpression` shape
 * exclusively. A BARE promise in a try/catch (`try { asyncFn() } catch {}`, no
 * await) is NOT detected — telling a promise-typed expression from a sync one needs
 * type-aware analysis. That case is a review catch, not a lint catch.
 *
 * SCOPE: the `try` BLOCK and the `finally` BLOCK. An await in either is
 * flagged. An await in the `catch` handler is legitimate recovery and stays
 * exempt. The asymmetry (block + finalizer flagged; handler exempt) is
 * intentional.
 */

/**
 * Walk an AST subtree looking for an AwaitExpression, WITHOUT descending into
 * boundaries that introduce a new async scope (nested functions) or a nested
 * try (which is judged on its own direct awaits, separately). An `await`
 * inside a nested function/arrow belongs to that function, not to the try we
 * are inspecting; an `await` inside a nested `try` belongs to that inner try.
 *
 * AST-only limitation: this counts a try as "containing await" when ANY direct
 * await sits anywhere in the inspected block, even if a genuinely-sync
 * statement in the same block (e.g. `JSON.parse(...)`) is what the author meant
 * to guard. Type-aware analysis would be needed to attribute the throw risk
 * precisely; that case uses the documented eslint-disable escape hatch (see
 * README "Escape hatch").
 *
 * Defensive by design: never throws on unexpected node shapes — unknown nodes
 * are simply traversed generically.
 *
 * @param {object | null | undefined} node - AST node to search from.
 * @returns {boolean} true if a direct (non-nested-function) await is found.
 */
function containsDirectAwait(node) {
  if (node === null || typeof node !== "object") {
    return false;
  }

  if (node.type === "AwaitExpression") {
    return true;
  }

  // Boundaries that open a new async scope — an await inside these is theirs.
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return false;
  }

  // A nested `try` is its own boundary: its direct awaits belong to it and are
  // judged when the TryStatement visitor reaches it. Descending here would let
  // an outer try be flagged for an await that only lives in a separately-handled
  // inner try.
  if (node.type === "TryStatement") {
    return false;
  }

  for (const key of Object.keys(node)) {
    // Skip parent/scope back-references to avoid infinite loops.
    if (key === "parent") {
      continue;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && containsDirectAwait(child)) {
          return true;
        }
      }
    } else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    ) {
      if (containsDirectAwait(value)) {
        return true;
      }
    }
  }

  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
const noPromiseTryCatch = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow wrapping promises/await in try/catch — use .catch()/.then()/.finally() instead."
    },
    schema: [],
    messages: {
      promiseTryCatch:
        "Do not wrap a promise/await in try/catch — use .catch()/.then()/.finally() instead."
    }
  },
  create(context) {
    return {
      TryStatement(node) {
        // The `try` BLOCK and the `finally` BLOCK (node.finalizer) are both
        // inspected. Awaits in the `catch` handler are a legitimate recovery
        // pattern and are NOT flagged. This asymmetry (block + finalizer
        // flagged; handler exempt) is intentional.
        //
        // The minimal node-access that can throw is the property read +
        // recursion; wrap only that. The swallow is deliberate: a thrown rule
        // breaks linting for the WHOLE file, so on the rare malformed node we
        // skip rather than crash. The guarded body does nothing else, so the
        // swallow cannot mask any other behaviour.
        let flagged = false;
        try {
          flagged =
            (Boolean(node.block) && containsDirectAwait(node.block)) ||
            (Boolean(node.finalizer) && containsDirectAwait(node.finalizer));
        } catch {
          // Defensive: malformed AST node — skip without breaking linting.
          return;
        }
        if (flagged) {
          context.report({ node, messageId: "promiseTryCatch" });
        }
      }
    };
  }
};

export default noPromiseTryCatch;
export { noPromiseTryCatch };
