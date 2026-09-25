// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "File Structure" (module
 * visibility) + `code-quality.md`/`code-quality.companion.md` "Module
 * Visibility Law". A disagreement between this skeleton, its worked example,
 * and the doctrine is a surfaced finding, never silently resolved toward
 * either.
 *
 * `@precedent` citations point at `client-email/` (collection half) and the
 * recovered pre-FE-2824 `client-email/index.ts` (both composables). Cite them
 * for facts; never copy their shape — the recovered barrel used
 * `export * from "./client-email.types"`, which the Module Visibility Law
 * forbids (curated named re-exports only).
 */
/**
 * @module module
 * @description Replace with the module's job to be done. HYBRID module — this
 * barrel exports TWO scoped composables: the collection (`useModules`) and the
 * per-entity manager (`useModuleManager`).
 *
 * This barrel is the module's ONLY public surface — `module.services.ts` /
 * `module.mappers.ts` / `module.schemas.ts` / `useModuleManager.machine.ts`
 * each carry their own line-1 internal marker and are never imported directly
 * by another module (`@internal/no-cross-module-imports`); never re-export one
 * of them wholesale (`@internal/no-barrel-imports`) — curated named re-exports
 * only.
 *
 * NO SCHEMA EXPORTS HERE. A hybrid module's `useSchema`/`useUischema` are
 * adopted by the manager's machine (`setSchemas`) and reach consumers through
 * `useModuleManager().useContext().schema` / `.uischema`. Re-exporting the bare
 * pair hands a form a schema the machine has not adopted — validating against
 * one contract while saving under another. The collection half needs neither.
 *
 * @doctrine `code-composables.md` Part B "File Structure" ("Module
 * visibility: `index.ts` is the module's ONLY public surface") +
 * `code-quality.md`/`code-quality.companion.md` Module Visibility Law
 * (`@internal/no-cross-module-imports`, `@internal/no-barrel-imports`).
 */

// --- Composables (collection + manager)
export { useModules, type UseModules } from "./useModules";
export { useModuleManager, type UseModuleManager } from "./useModuleManager";

// --- Scope matrices — one per composable, both public
export { MODULE_SCOPE_MATRIX, ModuleContextTypes } from "./module.types";
export type { ModuleScopeMatrix } from "./module.types";
export {
  MODULE_MANAGER_SCOPE_MATRIX,
  ModuleManagerContextTypes
} from "./module.types";
export type { ModuleManagerScopeMatrix } from "./module.types";

// --- Sub-composable type exports for consumers (collection)
export type { UseModuleActions } from "./useModules.actions";
export type { UseModuleContext } from "./useModules.context";
export type { UseModuleMeta } from "./useModules.meta";
export type { UseModuleInternals } from "./useModules.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseModuleManagerActions } from "./useModuleManager.actions";
export type { UseModuleManagerContext } from "./useModuleManager.context";
export type { UseModuleManagerMeta } from "./useModuleManager.meta";
export type { UseModuleManagerInternals } from "./useModuleManager.internals";

// --- Public item/model types (shared by both composables)
export type { ModuleItem, ModuleModel } from "./module.types";
