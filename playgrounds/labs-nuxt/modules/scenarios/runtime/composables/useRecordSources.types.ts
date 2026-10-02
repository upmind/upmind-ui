// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useRecordSources.types
 * @description What a record surface gets back from booting its sections'
 * second composables: the rows each fills into the model, and whether each is
 * still reading.
 */

import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

export type RecordSources = {
  /** The model patch — each sourced section's rows at its own scope. */
  values: ComputedRef<Record<string, unknown>>;
  /** True while the section's source has not settled its first read. */
  isLoading: (key: string) => boolean;
};
