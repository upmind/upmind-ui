import { computed } from "vue";
import type { ClientCustomFieldImageServices } from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFieldImage.meta
 * @description Per-field IMAGE meta — computed state flags projected from
 * `system-upload`'s own `useUpload().meta`.
 *
 * AC-18 IS PARTIALLY DELIVERED — binary 0/100, no incremental progress; real
 * progress requires XHR/streams in `query`/`system-upload`, out of scope.
 * Docs and review must not describe incremental progress as delivered.
 *
 * @decision `progress` is a two-value (0/100) signal, not a real byte-level
 * percentage.
 * what:    `progress` is `100` once `useUpload().meta.isComplete`, else `0`.
 * why:     legacy tracks real upload progress via axios's `onUploadProgress`
 *          (`customFields.vue:375-383`); this headless tree's upload
 *          transport (`query/useQuery.ts`'s `doFetch`) calls the native
 *          `fetch()` with no upload-progress hook, and the upload machine's
 *          `PROGRESS` event (`system-upload.machine.ts:75-78`) is never
 *          dispatched anywhere in `system-upload` — `useUpload()`'s own
 *          return type does not expose the machine's `progress` context
 *          field at all. Both `system-upload` and `query` are outside this
 *          run's write scope (R5), so this is a real, JTBD-relevant capability
 *          gap this module cannot close from here — surfaced rather than
 *          faked with a synthetic incrementing value.
 * rejected: interpolating a fake incrementing progress value on a timer —
 *          rejected as a fabricated signal indistinguishable from real
 *          progress to a consumer, which is worse than an honest binary one.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCustomFieldImageMeta(
  _actorScope: ScopeActorTypes,
  service: ClientCustomFieldImageServices
) {
  const isUploading = computed(
    () =>
      service.uploader.meta.value.isProcessing ||
      service.uploader.meta.value.isLoading
  );

  const isComplete = computed(() => service.uploader.meta.value.isComplete);

  const hasError = computed(
    () => !!service.error.value || service.uploader.meta.value.hasErrors
  );

  const progress = computed(() => (isComplete.value ? 100 : 0));

  // --- actor-specific meta: none earned yet (clause 2).

  return {
    /** True while this field's upload/load is in flight. */
    isUploading,

    /** True once the field's current upload/load has settled successfully. */
    isComplete,

    /** True if the upload, or a prior mutation, failed. */
    hasError,

    /** See this function's own `@decision` — a two-value (0/100) signal. */
    progress,

    /** True while this scope can address a client with a resolved field. */
    isAvailable: service.isAvailable

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientCustomFieldImageMeta = ReturnType<
  typeof createClientCustomFieldImageMeta
>;
