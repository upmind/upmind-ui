// --- external
import { computed, getCurrentScope, onScopeDispose, ref, toValue } from "vue";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

// -----------------------------------------------------------------------------
// --- singleton

/**
 * Cascade sources contributed by ancestors. A module-level singleton rather than
 * provide/inject, so it works outside component setup (stores, plain
 * composables) and needs no ancestor.
 */
const sources = ref(new Set<MaybeRefOrGetter<boolean | undefined>>());

/** True while any contributed cascade source is truthy. */
const isCascading = computed(() =>
  [...sources.value].some(source => Boolean(toValue(source)))
);

// -----------------------------------------------------------------------------
// --- composable

/**
 * Resolves the readonly state for an interactive component. ORs the local
 * source (e.g. a `readonly` prop) with the cascade singleton.
 *
 * @param source - local readonly source, e.g. `() => props.readonly`
 */
export const useReadonly = (
  source?: MaybeRefOrGetter<boolean | undefined>
): ComputedRef<boolean> =>
  computed(() => Boolean(toValue(source)) || isCascading.value);

// -----------------------------------------------------------------------------
// --- setter

/**
 * Registers a readonly cascade source for every `useReadonly` consumer to
 * inherit. Returns a stop fn; auto-cleans on scope dispose when called inside a
 * component/effect scope, so a contributor's value drops when it unmounts.
 *
 * @param source - cascade source
 */
export const setReadonly = (
  source: MaybeRefOrGetter<boolean | undefined>
): (() => void) => {
  sources.value.add(source);

  const stop = () => {
    sources.value.delete(source);
  };

  if (getCurrentScope()) onScopeDispose(stop);
  return stop;
};
