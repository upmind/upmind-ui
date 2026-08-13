// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "File Structure" (module
 * visibility) + `code-quality.md`/`code-quality.companion.md` "Module
 * Visibility Law". A disagreement between this skeleton, its worked example,
 * and the doctrine is a surfaced finding, never silently resolved toward
 * either.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */
/**
 * @module module
 * @description Replace with the module's job to be done. This barrel is the
 * module's ONLY public surface — `module.services.ts` / `module.mappers.ts` /
 * `module.schemas.ts` each carry their own line-1 internal marker and are
 * never imported directly by another module
 * (`@internal/no-cross-module-imports`); never re-export one of them wholesale
 * (`@internal/no-barrel-imports`) — curated named re-exports only.
 * @doctrine `code-composables.md` Part B "File Structure" ("Module
 * visibility: `index.ts` is the module's ONLY public surface") +
 * `code-quality.md`/`code-quality.companion.md` Module Visibility Law
 * (`@internal/no-cross-module-imports`, `@internal/no-barrel-imports`).
 * @precedent `client-email/index.ts`.
 */

export { useModule, type UseModule } from "./useModule";

// --- Scope matrix
export { MODULE_SCOPE_MATRIX, ModuleContextTypes } from "./module.types";
export type { ModuleScopeMatrix } from "./module.types";

// --- Sub-composable type exports for consumers
export type { UseModuleActions } from "./useModule.actions";
export type { UseModuleContext } from "./useModule.context";
export type { UseModuleMeta } from "./useModule.meta";
export type { UseModuleInternals } from "./useModule.internals";

// --- Public item/model types
export type { ModuleItem, ModuleModel } from "./module.types";
