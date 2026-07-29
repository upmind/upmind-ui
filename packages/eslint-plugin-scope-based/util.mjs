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
