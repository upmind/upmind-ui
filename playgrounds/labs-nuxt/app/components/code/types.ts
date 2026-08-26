/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-25) — queried for
 * `codeblock` · `shiki` · `highlighter`: no existing code-block component in
 * the playground tree. This types file is minted per docs/sdd/FE-3125/sheets-dx.md §2.1.
 * Re-queried 2026-08-26 (`DataAttrs` · `useTestAttrs`): the graph indexes no
 * `DataAttrs` node — it is a type-only export — so the source is the authority
 * and it is `@upmind/ui`'s `lib/use-test-attrs.ts`, consumed here rather than
 * re-declared. `highlightLines` is DELETED rather than kept: nothing read it,
 * so it documented a capability the component never had.
 */
// -----------------------------------------------------------------------------
/**
 * @module components/code/types
 * @description Type definitions for the playground's shiki code block.
 */

import type { DataAttrs } from "@upmind/ui";

// -----------------------------------------------------------------------------

export type CodeBlockProps = {
  /** The source code to highlight. */
  code: string;
  /** Language for syntax highlighting (e.g., "vue", "ts", "gherkin"). */
  lang?: string;
  /** Filename or title displayed above the block. */
  title?: string;
  /** Wrap long lines instead of horizontal scroll. Default false. */
  wrap?: boolean;
  /** Show line numbers. Default true. */
  lineNumbers?: boolean;
  /**
   * Hide the copy button. Default false — set it wherever the block may hold
   * credentials, since Copy is a one-press export of whatever is rendered.
   */
  hideCopy?: boolean;
  /**
   * Escape-hatch data/test attributes for the copy button; a parent's key/value
   * wins here, never by fallthrough (`CC11`).
   */
  dataAttrs?: DataAttrs;
};
