import {
  useForwardProps as radixUseForwardProps,
  useForwardPropsEmits as radixUseForwardPropsEmits
} from "radix-vue";
import { computed, type MaybeRefOrGetter } from "vue";
import { useTestAttrs, type TestAttrsOptions } from "./useTestAttrs";

/**
 * Test-attr-aware variants of radix-vue's `useForwardProps` and
 * `useForwardPropsEmits`.
 *
 * radix rebuilds its output from the component's declared prop keys plus the
 * keys the parent actually passed in its template — it never iterates the
 * object it is handed, so test attributes spread into `delegatedProps` are
 * silently dropped and never reach the DOM.
 *
 * Pass the `useTestAttrs` options as the trailing argument instead: the
 * wrapper generates the attrs and re-attaches them after radix's forwarding,
 * so they always land on the rendered element (and are still stripped from
 * PROD builds by `useTestAttrs`).
 *
 *   const forwarded = useForwardPropsEmitsTests(delegatedProps, emits, {
 *     key: "dialog-window",
 *     dataAttrs: props.dataAttrs
 *   });
 */

export function useForwardPropsTests<T extends Record<string, unknown>>(
  props: MaybeRefOrGetter<T>,
  testAttrsInput: TestAttrsOptions
) {
  const forwarded = radixUseForwardProps(props as T);
  const testAttrs = useTestAttrs(testAttrsInput);
  return computed(() => ({ ...forwarded.value, ...testAttrs }));
}

export function useForwardPropsEmitsTests<T extends Record<string, unknown>>(
  props: MaybeRefOrGetter<T>,
  emits: (name: any, ...args: any[]) => void,
  testAttrsInput: TestAttrsOptions
) {
  const forwarded = radixUseForwardPropsEmits(props as T, emits as any);
  const testAttrs = useTestAttrs(testAttrsInput);
  return computed(() => ({ ...forwarded.value, ...testAttrs }));
}
