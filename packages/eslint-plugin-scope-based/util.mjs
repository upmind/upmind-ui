/**
 * @fileoverview Shared helpers for the `scope-based` ESLint plugin — the AST
 * replacement for the hand-rolled `law-checker.mjs` string lexer. Every helper
 * here works on real ESTree/typescript-eslint nodes, so the whole class of
 * regex/offset bugs the checker carried (nested-return truncation, `<...>` span
 * exemptions, back-to-back `@decision` merges, catastrophic backtracking) cannot
 * recur.
 *
 * @module packages/eslint-plugin-scope-based/util
 */

/** Escape a string for safe interpolation into a `RegExp`. */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * An actor-arm filename: `<base>.<actor>.ts` for a concrete actor. Single
 * source of truth for the arm-actor suffix set — a new actor is added here
 * once, not in each rule (which would drift).
 */
export const ARM_FILENAME_RE = /^(.*)\.(client|staff|guest)\.ts$/;

/** The `<MODULE>_SCOPE_MATRIX` name of a module's actor matrix value. */
export const SCOPE_MATRIX_NAME_RE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*_SCOPE_MATRIX$/;

/** The basename (final path segment) of a file path. */
export function basenameOf(file) {
  return file.slice(file.lastIndexOf("/") + 1);
}

/** True for the member expression `ScopeActorTypes.SELF`. */
export function isScopeActorSelf(node) {
  return (
    !!node &&
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object?.type === "Identifier" &&
    node.object.name === "ScopeActorTypes" &&
    node.property?.type === "Identifier" &&
    node.property.name === "SELF"
  );
}

/** True for the string literal `'self'` / `"self"`. */
export function isSelfStringLiteral(node) {
  return !!node && node.type === "Literal" && node.value === "self";
}

const EQUALITY_OPERATORS = new Set(["===", "!==", "==", "!="]);
const MEMBERSHIP_METHODS = new Set(["includes", "has"]);
// TS wrappers that a cast can slip between the SELF node and its real parent.
const TS_WRAPPERS = new Set([
  "TSAsExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
  "TSSatisfiesExpression"
]);

/**
 * Classify a `SELF`-valued node by its syntactic position:
 *   "switch"     — the `test` of a `case ScopeActorTypes.SELF:`
 *   "comparison" — an operand of an `==`/`===`/`!=`/`!==` comparison, OR an
 *                  element of a `[…].includes(actor)` / `new Set([…]).has(actor)`
 *                  membership test — both are branches on SELF
 *   "call-site"  — an argument of a `.as(...)` call (documented builder API)
 *   "matrix-key" — the computed key of an `{ [ScopeActorTypes.SELF]: ... }` entry
 *   "value"      — any other value position (passed/assigned, never a branch)
 * A branch is `switch` or `comparison`; everything else is not.
 */
export function classifySelfPosition(node) {
  // Unwrap TS wrappers first (`SELF as X`, `SELF!`, `<X>SELF`,
  // `SELF satisfies X`) so a one-token cast can't reparent the sentinel under a
  // TS node and hide a genuine case/comparison branch.
  let self = node;
  while (self.parent && TS_WRAPPERS.has(self.parent.type)) self = self.parent;

  const parent = self.parent;
  if (!parent) return "value";

  if (parent.type === "SwitchCase" && parent.test === self) return "switch";

  if (
    (parent.type === "BinaryExpression" ||
      parent.type === "LogicalExpression") &&
    EQUALITY_OPERATORS.has(parent.operator) &&
    (parent.left === self || parent.right === self)
  ) {
    return "comparison";
  }

  // `[ScopeActorTypes.SELF, …].includes(actor)` — a branch on SELF expressed
  // as array membership rather than a case/comparison.
  if (parent.type === "ArrayExpression") {
    const member = parent.parent;
    if (
      member?.type === "MemberExpression" &&
      member.object === parent &&
      member.property?.type === "Identifier" &&
      MEMBERSHIP_METHODS.has(member.property.name) &&
      member.parent?.type === "CallExpression" &&
      member.parent.callee === member
    ) {
      return "comparison";
    }
  }

  if (
    parent.type === "CallExpression" &&
    parent.arguments.includes(self) &&
    parent.callee?.type === "MemberExpression" &&
    parent.callee.property?.type === "Identifier" &&
    parent.callee.property.name === "as"
  ) {
    return "call-site";
  }

  // `{ [ScopeActorTypes.SELF]: ... }` — a scope-matrix type-shape key, not a branch.
  if (parent.type === "Property" && parent.computed && parent.key === self) {
    return "matrix-key";
  }

  return "value";
}

export function isBranchPosition(position) {
  return position === "switch" || position === "comparison";
}

const FIELD_PATTERNS = {
  what: /\bwhat\s*:/i,
  why: /\bwhy\s*:/i,
  rejected: /\brejected\s*:/i
};

// `@decision` counts as a block marker ONLY when it LEADS a comment line
// (optionally after a JSDoc `*`). A prose cross-reference — `// See the
// @decision in ADR-001` — is an instruction, not a block, and must not be
// scored for completeness.
const MARKER_RE = /(?:^|\n)[ \t]*\*?[ \t]*@decision\b/;

/**
 * Group a file's comments into logical `@decision` blocks.
 *
 * A block comment (`/* … *\/`) is one block. A run of contiguous line comments
 * (`//`) is one block, EXCEPT that each `@decision` marker starts a fresh block
 * — so two back-to-back `// @decision` runs are two blocks, never one merged
 * block (the law-checker `extractCommentBlockAround` bug, F5, cannot recur).
 *
 * Only blocks whose text carries an `@decision` marker are returned.
 */
export function getDecisionBlocks(sourceCode) {
  const comments = sourceCode.getAllComments();
  const blocks = [];
  let pending = null;

  const flush = () => {
    if (pending) {
      blocks.push(pending);
      pending = null;
    }
  };

  for (const comment of comments) {
    const hasMarker = MARKER_RE.test(comment.value);

    if (comment.type === "Block") {
      flush();
      if (hasMarker) {
        blocks.push({
          node: comment,
          line: comment.loc.start.line,
          text: comment.value
        });
      }
      continue;
    }

    // Line comment.
    if (pending) {
      // Absorb contiguous non-marker line comments, tolerating a single blank
      // line inside the block (a readability gap, not a block boundary).
      const adjacent = comment.loc.start.line - pending.endLine <= 2;
      if (adjacent && !hasMarker) {
        pending.text += `\n${comment.value}`;
        pending.endLine = comment.loc.end.line;
        continue;
      }
      flush();
    }

    if (hasMarker) {
      pending = {
        node: comment,
        line: comment.loc.start.line,
        endLine: comment.loc.end.line,
        text: comment.value
      };
    }
  }
  flush();

  return blocks.map(block => ({
    node: block.node,
    line: block.line,
    text: block.text,
    fields: {
      what: FIELD_PATTERNS.what.test(block.text),
      why: FIELD_PATTERNS.why.test(block.text),
      rejected: FIELD_PATTERNS.rejected.test(block.text)
    }
  }));
}

/** The fields a complete `@decision` block must carry (clause 5). */
export const REQUIRED_DECISION_FIELDS = ["what", "why", "rejected"];

/**
 * True when the file carries a COMPLETE `@decision` block (what/why/rejected)
 * that names `keyName` — the clause-5 justification for a clause-2/3 deviation.
 * Anchored to a real complete block, so a bare prose mention never excuses it.
 */
export function hasCompleteDecisionFor(sourceCode, keyName) {
  const nameRe = new RegExp(`\\b${escapeRegExp(keyName)}\\b`);
  return getDecisionBlocks(sourceCode).some(
    block =>
      REQUIRED_DECISION_FIELDS.every(field => block.fields[field]) &&
      nameRe.test(block.text)
  );
}

// ---------------------------------------------------------------------------
// Composable file and factory helpers (the module-law rules below share them).
// ---------------------------------------------------------------------------

/** Any `.test.` / `.spec.` / fixtures / `__tests__` file — never governed. */
export function isTestFile(filename) {
  return /\.(test|spec|int\.test|no-test)\.[cm]?tsx?$|__tests__\/|\.fixtures\.ts$/.test(
    filename
  );
}

/** `use<Module>[.<layer>[.<actor>]].ts`, split into its parts, or null. */
export function composableFile(filename) {
  const m = basenameOf(filename).match(
    /^(use[A-Z][A-Za-z0-9_]*)(?:\.(actions|context|meta|internals))?(?:\.(client|staff|guest))?\.ts$/
  );
  if (!m) return null;
  return { composable: m[1], layer: m[2] ?? null, actor: m[3] ?? null };
}

/** The module directory (child of `modules/`) a file lives in, or null. */
export function moduleDirOf(filename) {
  const m = filename.replace(/\\/g, "/").match(/^(.*\/modules\/[^/]+)\//);
  return m ? m[1] : null;
}

/** The own name a top-level function-like node carries, or null. */
export function topLevelFunctionName(fn) {
  if (fn.type === "FunctionDeclaration") {
    const p = fn.parent;
    const top =
      p.type === "Program" ||
      (p.type === "ExportNamedDeclaration" && p.parent.type === "Program") ||
      (p.type === "ExportDefaultDeclaration" && p.parent.type === "Program");
    return top && fn.id ? fn.id.name : null;
  }
  if (
    fn.type === "ArrowFunctionExpression" ||
    fn.type === "FunctionExpression"
  ) {
    const d = fn.parent;
    if (
      d?.type === "CallExpression" &&
      d.callee.type === "Identifier" &&
      d.callee.name === "createScopedComposable" &&
      d.arguments.includes(fn)
    ) {
      return "createScopedComposable";
    }
    if (d?.type !== "VariableDeclarator" || d.init !== fn) return null;
    if (d.id.type !== "Identifier") return null;
    const decl = d.parent;
    const top =
      decl.parent.type === "Program" ||
      (decl.parent.type === "ExportNamedDeclaration" &&
        decl.parent.parent.type === "Program");
    return top ? d.id.name : null;
  }
  return null;
}

/** The nearest enclosing function node of a node, or null. */
export function enclosingFunction(node) {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (
      cur.type === "FunctionDeclaration" ||
      cur.type === "FunctionExpression" ||
      cur.type === "ArrowFunctionExpression"
    ) {
      return cur;
    }
  }
  return null;
}

/**
 * Visit each object literal that a top-level factory function returns
 * directly (`return { ... }` or an arrow body `({ ... })`). Calls
 * `visit(objectNode, factoryName)`.
 */
export function onReturnedObjects(visit) {
  function handle(objectNode, fn) {
    const name = topLevelFunctionName(fn);
    if (name) visit(objectNode, name);
  }
  return {
    ReturnStatement(node) {
      const arg = node.argument;
      if (arg?.type !== "ObjectExpression") return;
      const fn = enclosingFunction(node);
      if (fn) handle(arg, fn);
    },
    ArrowFunctionExpression(node) {
      if (node.body.type === "ObjectExpression") handle(node.body, node);
    }
  };
}

/** The static name of an object property key, or null. */
export function propertyKeyName(prop) {
  if (prop.type !== "Property" || prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
    return prop.key.value;
  }
  return null;
}

/** True for a function-like node. */
export function isFunctionNode(node) {
  return (
    !!node &&
    (node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression")
  );
}
