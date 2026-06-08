// --- external
import { computed, inject, provide, toValue } from "vue";
import type {
  ComputedRef,
  InjectionKey,
  MaybeRef,
  MaybeRefOrGetter
} from "vue";

// -----------------------------------------------------------------------------
// --- key

/**
 * Injection key for the disabled signal. Any ancestor `provide()` under this
 * key will be picked up by `useDisabled` descendants.
 */
export const DISABLED_KEY: InjectionKey<MaybeRef<boolean>> =
  Symbol("UPMIND.UI.DISABLED");

// -----------------------------------------------------------------------------
// --- composable

/**
 * Resolves the disabled state for an interactive component. ORs the local
 * source (e.g. a `disabled` prop) with any ancestor-provided value.
 *
 * @param source - local disabled source, e.g. `() => props.disabled`
 */
export const useDisabled = (
  source?: MaybeRefOrGetter<boolean | undefined>
): ComputedRef<boolean> => {
  const provided = inject(DISABLED_KEY, false);

  /** Resolved disabled — true when local source OR any ancestor provides true. */
  const isDisabled = computed(
    () => Boolean(toValue(source)) || Boolean(toValue(provided))
  );

  return isDisabled;
};

// -----------------------------------------------------------------------------
// --- provider

/**
 * Provides a disabled signal to descendants. Accepts a plain boolean or a ref.
 */
export const provideDisabled = (value: MaybeRef<boolean>): void => {
  provide(DISABLED_KEY, value);
};
