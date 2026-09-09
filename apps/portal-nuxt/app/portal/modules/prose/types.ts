// -----------------------------------------------------------------------------
/**
 * @module portal/modules/prose/types
 * @description Prop contract for the `prose` module — brand-authored PROSE
 * (`markdown`, over `@upmind/ui`'s `Markdown` inside `ClampText`) and the
 * provider panels embedded beside it (`frames`, over an `iframe` per panel).
 * One module, because both are the same thing from the page's side: content
 * the brand or the provider wrote, which the portal renders and never
 * interprets.
 */

export const PROSE_MODULE_VARIANT = {
  /** Authored markdown, clamped with a Show-more control. */
  MARKDOWN: "markdown",
  /** The provider's own embedded panels. */
  FRAMES: "frames"
} as const;

export type ProseModuleVariant =
  (typeof PROSE_MODULE_VARIANT)[keyof typeof PROSE_MODULE_VARIANT];

/** One embedded provider panel — its accessible name and the document it loads. */
export interface ProseModuleFrame {
  readonly title: string;
  readonly url: string;
}

export interface ProseModuleProps {
  /** The registered module variant (registry.ts) — which of the two forms renders. */
  readonly variant?: ProseModuleVariant;
  /** `markdown` only — the source. Empty renders the empty state. */
  readonly markdown?: string;
  /** `markdown` only — how many lines show before the toggle. */
  readonly lines?: number;
  /** `markdown` only — the toggle's labels. No English default (CC22). */
  readonly showMoreLabel?: string;
  readonly showLessLabel?: string;
  /** `frames` only — the panels to embed, in order. */
  readonly frames?: readonly ProseModuleFrame[];
  /** Heading shown when there is nothing to render. No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
}
