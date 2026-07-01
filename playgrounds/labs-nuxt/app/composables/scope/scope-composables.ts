/**
 * @module scope/scope-composables
 * @description Vue composables for reading scope configuration from route.meta
 *
 * These composables are Vue Router dependent and stay in labs (not headless).
 * They read the parsed scope from route.meta.scopeConfig (set by extractScope funnel service).
 */

import { computed, type ComputedRef } from "vue";
import { useRoute } from "vue-router";
import { ScopeActorTypes } from "@upmind-automation/headless";
import type { ScopeContext } from "@upmind-automation/headless";

export type BrandScope = { mode: "org" } | { mode: "brand"; brandId: string };

export type ScopeConfig = {
  brandId?: string;
  actor: ScopeActorTypes;
  context?: ScopeContext;
};

/**
 * Get brand scope from URL (first path segment).
 * Returns 'org' mode or specific brand ID.
 *
 * @returns Brand scope configuration
 *
 * @example
 * // URL: /org/useAuth
 * const brand = useBrandScope();
 * // => { mode: 'org' }
 *
 * @example
 * // URL: /brand-x/useAuth
 * const brand = useBrandScope();
 * // => { mode: 'brand', brandId: 'brand-x' }
 */
export function useBrandScope(): ComputedRef<BrandScope> {
  const route = useRoute();

  return computed(() => {
    const brandIdOrOrg = route.params.brandIdOrOrg as string | undefined;

    if (!brandIdOrOrg || brandIdOrOrg === "org") {
      return { mode: "org" };
    }

    return {
      mode: "brand",
      brandId: brandIdOrOrg
    };
  });
}

/**
 * Get actor scope from route.meta.scopeConfig (parsed by extractScope service).
 * Defaults to SELF if no actor specified in URL.
 *
 * Accepts an optional type parameter to constrain the returned actor type,
 * allowing `.as()` to resolve the correct builder type without casts.
 *
 * @typeParam TActor - Constrained actor types for this page's composable
 * @returns Actor scope
 *
 * @example
 * // Untyped (returns full ScopeActorTypes union)
 * const actor = useActorScope();
 *
 * @example
 * // Typed for auth page (returns CLIENT | STAFF)
 * const actor = useActorScope<ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF>();
 */
export function useActorScope<
  TActor extends ScopeActorTypes = ScopeActorTypes
>(): ComputedRef<TActor> {
  const route = useRoute();

  return computed(() => {
    const scopeConfig = route.meta.scopeConfig as
      | { actor?: ScopeActorTypes }
      | undefined;
    return (scopeConfig?.actor || ScopeActorTypes.SELF) as TActor;
  });
}

/**
 * Get context scope from route.meta.scopeConfig (parsed by extractScope service).
 * Returns undefined if no context in URL.
 *
 * Accepts an optional type parameter to constrain the context type,
 * allowing `.for()` to resolve the correct context types without casts.
 *
 * @typeParam TContextType - Context type enum for this page's composable
 * @returns Context scope or undefined
 *
 * @example
 * // Untyped (context.type is string)
 * const context = useContextScope();
 *
 * @example
 * // Typed for auth page (context.type is AuthContextTypes)
 * const context = useContextScope<`${AuthContextTypes}`>();
 */
export function useContextScope<
  TContextType extends string = string
>(): ComputedRef<ScopeContext<TContextType> | undefined> {
  const route = useRoute();

  return computed(() => {
    const scopeConfig = route.meta.scopeConfig as
      | { context?: ScopeContext<TContextType> }
      | undefined;
    return scopeConfig?.context;
  });
}

/**
 * Get complete scope configuration (brand + actor + context).
 * Combines all three scope composables.
 *
 * @returns Complete scope configuration
 *
 * @example
 * // URL: /brand-x/useAuth/as/staff/for/client/123
 * const scope = useScopeConfig();
 * // => { brandId: 'brand-x', actor: 'staff', context: { type: 'client', id: '123' } }
 */
export function useScopeConfig(): ComputedRef<ScopeConfig> {
  const brand = useBrandScope();
  const actor = useActorScope();
  const context = useContextScope();

  return computed(() => ({
    brandId: brand.value.mode === "brand" ? brand.value.brandId : undefined,
    actor: actor.value,
    context: context.value
  }));
}
