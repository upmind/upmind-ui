import {
  computed,
  inject,
  provide,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref
} from "vue";
import { unrefElement, type MaybeComputedElementRef } from "@vueuse/core";

export type PortalTarget = HTMLElement | string | undefined;

const PORTAL_TARGET_KEY: InjectionKey<Ref<PortalTarget>> = Symbol(
  "upmind-ui:portal-target"
);

/**
 * Register this component as a portal target for descendant overlays. Pass a
 * template ref (to a component or element) and its root element is used, so
 * overlays rendered inside teleport into this component's stacking context
 * instead of competing at body level.
 */
export function providePortalTarget(source: MaybeComputedElementRef): void {
  provide(
    PORTAL_TARGET_KEY,
    computed(() => unrefElement(source) ?? undefined)
  );
}

/**
 * Resolve the portal target for an overlay. Priority:
 *   1. explicit `to` prop from the consumer
 *   2. nearest ancestor that called `providePortalTarget`
 *   3. `undefined` (radix portals fall back to `document.body`)
 */
export function usePortalTarget(
  propsTo: MaybeRefOrGetter<PortalTarget>
): ComputedRef<PortalTarget> {
  const injected = inject(PORTAL_TARGET_KEY, undefined);
  return computed(() => toValue(propsTo) ?? injected?.value);
}
