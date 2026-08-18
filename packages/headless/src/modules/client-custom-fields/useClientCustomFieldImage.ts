import { createScopedComposable } from "../scope";
import { createClientCustomFieldImageServices } from "./client-custom-fields.services";
import { createClientCustomFieldImageActions } from "./useClientCustomFieldImage.actions";
import { createClientCustomFieldImageContext } from "./useClientCustomFieldImage.context";
import { createClientCustomFieldImageInternals } from "./useClientCustomFieldImage.internals";
import { createClientCustomFieldImageMeta } from "./useClientCustomFieldImage.meta";
import type { ClientCustomFieldImageScopeMatrix } from "./client-custom-fields.types";
import type { ScopeBuilder, ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFieldImage
 * @description Scoped per-field IMAGE value editor, wrapping
 * `system-upload`'s existing interpreter (`useUpload`) — this module adds NO
 * machine file (R6). Sibling of `useClientCustomFields`, registered under
 * the SAME `name` string (`"client-custom-fields"`) — see that file's own
 * header comment for the real key mechanism (`generateScopeKey`'s
 * `name:actor[:context.type:context.id]...`, which never reads the calling
 * composable's function name) and why this composable's OWN context type
 * (`ClientCustomFieldContextTypes.FIELD`) keeps its entries apart from the
 * collection's in practice, not by any name-level guarantee. This composable
 * is never called bare — always `.for('field', id)` — which is the ONLY
 * reason the latent same-actor collision never surfaces.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientCustomFieldImageForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope — holds the persistent
   * `system-upload` interpreter for this field's lifetime.
   */
  const service = createClientCustomFieldImageServices(
    actorScope,
    config.context
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for upload/remove/flush actions and lifecycle. */
    useActions: () =>
      createClientCustomFieldImageActions(actorScope, service, scopeKey),

    /** Sub-composable for reactive value/hash/preview context. */
    useContext: () => createClientCustomFieldImageContext(actorScope, service),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createClientCustomFieldImageInternals(actorScope, service),

    /** Sub-composable for upload state flags. */
    useMeta: () => createClientCustomFieldImageMeta(actorScope, service)
  };
}
// -----------------------------------------------------------------------------
/**
 * @decision defer the `createScopedComposable` registration to first
 * invocation, mirroring its sibling `useClientCustomFields`.
 * what:    a plain function with the SAME call signature and return type
 *          `createScopedComposable(...)` itself produces
 *          (`() => ScopeBuilder<T, TMatrix>`); it registers via
 *          `createScopedComposable` on first call and caches the returned
 *          builder-factory. No barrel or consumer change.
 * why:     same import-chain landmine as `useClientCustomFields` — see the
 *          full `@decision` there for the `file:line` chain and rationale;
 *          this composable shares the SAME module and the SAME `../scope`
 *          import, so it is equally exposed.
 * rejected: the same alternatives rejected there (reordering imports; editing
 *          `scope.utils.ts`/`basket-fields.services.ts`) — not repeated here.
 *
 * @example
 * ```ts
 * const image = useClientCustomFieldImage().as('client').for('field', fieldId)
 * const { downloadUrl, preview } = image.useContext()
 * await image.useActions().upload(file)
 * ```
 */
let registeredUseClientCustomFieldImage:
  | (() => ScopeBuilder<
      ReturnType<typeof createClientCustomFieldImageForScope>,
      ClientCustomFieldImageScopeMatrix
    >)
  | undefined;

export function useClientCustomFieldImage(): ScopeBuilder<
  ReturnType<typeof createClientCustomFieldImageForScope>,
  ClientCustomFieldImageScopeMatrix
> {
  if (!registeredUseClientCustomFieldImage) {
    registeredUseClientCustomFieldImage = createScopedComposable<
      ReturnType<typeof createClientCustomFieldImageForScope>,
      ClientCustomFieldImageScopeMatrix
    >("client-custom-fields", createClientCustomFieldImageForScope);
  }
  return registeredUseClientCustomFieldImage();
}

// Type export for consumers
export type UseClientCustomFieldImage = ReturnType<
  typeof useClientCustomFieldImage
>;
