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
 * Injection key for the readonly signal. Any ancestor `provide()` under this
 * key will be picked up by `useReadonly` descendants.
 */
export const READONLY_KEY: InjectionKey<MaybeRef<boolean>> =
  Symbol("UPMIND.UI.READONLY");

// -----------------------------------------------------------------------------
// --- composable

/**
 * Resolves the readonly state for an interactive component. ORs the local
 * source (e.g. a `readonly` prop) with any ancestor-provided value.
 *
 * @param source - local readonly source, e.g. `() => props.readonly`
 */
export const useReadonly = (
  source?: MaybeRefOrGetter<boolean | undefined>
): ComputedRef<boolean> => {
  const provided = inject(READONLY_KEY, false);

  /** Resolved readonly — true when local source OR any ancestor provides true. */
  const isReadonly = computed(
    () => Boolean(toValue(source)) || Boolean(toValue(provided))
  );

  return isReadonly;
};

// -----------------------------------------------------------------------------
// --- provider

/**
 * Provides a readonly signal to descendants. Accepts a plain boolean or a ref.
 */
export const provideReadonly = (value: MaybeRef<boolean>): void => {
  provide(READONLY_KEY, value);
};
