// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages
 * @description Public exports for the brand's client-area custom pages — the
 * COLLECTION (`useClientCustomPages`) and the SINGLE READ by slug
 * (`useClientCustomPage`), each a separately exported, separately consumed
 * capability. Curated named re-exports only — no `export *` (Module
 * Visibility Law).
 */

// --- Composables
export { useClientCustomPages } from "./useClientCustomPages";
export type { UseClientCustomPages } from "./useClientCustomPages";
export { useClientCustomPage } from "./useClientCustomPage";
export type { UseClientCustomPage } from "./useClientCustomPage";

// --- Scope matrix — the COLLECTION's only. The single read's matrix refuses
// every actor, so it names no context a consumer could spell and stays
// internal; it marks its record with the builder's `.withId(slug)`, not a
// context.
export {
  CLIENT_CUSTOM_PAGES_SCOPE_MATRIX,
  ClientCustomPagesContextTypes,
  CustomPagesSortableProperties
} from "./client-custom-pages.types";
export type { ClientCustomPagesScopeMatrix } from "./client-custom-pages.types";

// --- Public model types
export type {
  CustomPage,
  CustomPagesFilters,
  CustomPagesFilterModel,
  CustomPagesSortEntry,
  CustomPagesSortModel
} from "./client-custom-pages.types";

// --- Sub-composable type exports (collection)
export type { UseClientCustomPagesActions } from "./useClientCustomPages.actions";
export type { UseClientCustomPagesContext } from "./useClientCustomPages.context";
export type { UseClientCustomPagesMeta } from "./useClientCustomPages.meta";
export type { UseClientCustomPagesInternals } from "./useClientCustomPages.internals";

// --- Sub-composable type exports (single read)
export type { UseClientCustomPageActions } from "./useClientCustomPage.actions";
export type { UseClientCustomPageContext } from "./useClientCustomPage.context";
export type { UseClientCustomPageMeta } from "./useClientCustomPage.meta";
export type { UseClientCustomPageInternals } from "./useClientCustomPage.internals";
