// -----------------------------------------------------------------------------
/**
 * @module portal/modules/empty-state/types
 * @description Prop contract for the `empty-state` module (tasks.md 5.3) —
 * a standalone empty placeholder, over `@upmind/ui`'s `EmptyState`. Distinct
 * from the per-module empty-data fallback every other module renders
 * internally (tasks.md 5.6) — this is the registered module a config assigns
 * a slot when the SLOT ITSELF is meant to read as empty.
 */

import type { Component } from "vue";

export interface EmptyStateModuleProps {
  /** Heading shown beneath the icon. No English default (CC22) — the consumer supplies its own copy. */
  readonly title?: string;
  /** Supporting copy. No English default (CC22). */
  readonly description?: string;
  /** The centered glyph. Absent = a generic inbox. */
  readonly icon?: Component;
}
