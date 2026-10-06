/**
 * @fileoverview `code-quality` — ESLint rules for cross-cutting TypeScript
 * quality and file hygiene. Each rule carries one principle of
 * `code-quality.md` / `code-typescript.md`, so the lint message replaces the
 * prose.
 *
 *   no-literal-union-type  — a value set is an enum; derive the union from it
 *   require-as-const       — an immutable literal value uses `as const`
 *   no-cast-chain          — no `as unknown as T` outside a named const initializer
 *   no-literal-error-message — an error message is a translation key, not prose
 *   no-history-comments    — a comment states the present: no id, date or history phrase
 *   no-lodash-get-state    — no lodash `get` on state or context
 *   no-chained-array-passes — one traversal, not a chain of filter/map/reject
 *   no-comment-in-imports  — no comment inside the import block
 *   import-separator       — the 80-character separator follows the imports
 *   file-header            — separator plus a JSDoc block with @module and @description
 *   section-separators     — `// --- name` or the 80-character line; no `// ===`, no closing line
 *
 * @module packages/eslint-plugin-code-quality
 */

import noLiteralUnionType from "./rules/no-literal-union-type.mjs";
import requireAsConst from "./rules/require-as-const.mjs";
import noCastChain from "./rules/no-cast-chain.mjs";
import noLiteralErrorMessage from "./rules/no-literal-error-message.mjs";
import noHistoryComments from "./rules/no-history-comments.mjs";
import noLodashGetState from "./rules/no-lodash-get-state.mjs";
import noChainedArrayPasses from "./rules/no-chained-array-passes.mjs";
import noCommentInImports from "./rules/no-comment-in-imports.mjs";
import importSeparator from "./rules/import-separator.mjs";
import fileHeader from "./rules/file-header.mjs";
import sectionSeparators from "./rules/section-separators.mjs";

const plugin = {
  meta: { name: "code-quality", version: "1.0.0" },
  rules: {
    "no-literal-union-type": noLiteralUnionType,
    "require-as-const": requireAsConst,
    "no-cast-chain": noCastChain,
    "no-literal-error-message": noLiteralErrorMessage,
    "no-history-comments": noHistoryComments,
    "no-lodash-get-state": noLodashGetState,
    "no-chained-array-passes": noChainedArrayPasses,
    "no-comment-in-imports": noCommentInImports,
    "import-separator": importSeparator,
    "file-header": fileHeader,
    "section-separators": sectionSeparators
  }
};

export default plugin;
