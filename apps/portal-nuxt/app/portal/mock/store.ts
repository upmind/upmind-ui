// -----------------------------------------------------------------------------
/**
 * @module portal/mock/store
 * @description The seed registry (plan §1.3, R3): one reactive in-memory
 * dataset per brand, seeded from that brand's seed module, plus the id
 * sequencing a created entity draws on. Nothing persists: a refresh reseeds.
 * Zero API surface by design.
 *
 * The MUTATIONS live on the facades (`facades/`), where a headless manager
 * keeps them — this file no longer knows what paying an invoice means.
 */

import { reactive } from "vue";
import { HOSTGRID_MOCK_DATASET } from "./hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "./hostgrid-minimal";
import { forEach, isObject, values } from "lodash-es";
import type { MockDataset } from "./types";
// -----------------------------------------------------------------------------

export const MOCK_DATASET_ID = {
  HOSTGRID: "hostgrid",
  /** Every brand gate on its OFF branch (plan R9) — `hostgrid-minimal.ts`. */
  HOSTGRID_MINIMAL: "hostgrid-minimal"
} as const;

export type MockDatasetId =
  (typeof MOCK_DATASET_ID)[keyof typeof MOCK_DATASET_ID];

/**
 * Freezes a seed all the way down. `Readonly<>` is a type-level claim only,
 * and a seed is `resetMockData`'s recovery point — so a caller handing the raw
 * seed to a mutating action must throw, not corrupt the one copy that reseeds.
 */
function deepFreeze(value: unknown): void {
  if (!isObject(value) || Object.isFrozen(value)) return;
  Object.freeze(value);
  forEach(values(value), entry => deepFreeze(entry));
}

const SEEDS: Readonly<Record<MockDatasetId, MockDataset>> = {
  [MOCK_DATASET_ID.HOSTGRID]: HOSTGRID_MOCK_DATASET,
  [MOCK_DATASET_ID.HOSTGRID_MINIMAL]: HOSTGRID_MINIMAL_MOCK_DATASET
};
deepFreeze(SEEDS);

const stores = new Map<MockDatasetId, MockDataset>();

/** Whether a shape id has a registered seed — a shape without one renders its data refs as absent. */
export function isMockDatasetId(value: unknown): value is MockDatasetId {
  return typeof value === "string" && value in SEEDS;
}

/** Deterministic ids for entities the session creates — never `Math.random`. */
let createdEntityCount = 0;

/** One sequence number per created entity, so its id and its document number agree. */
export function nextSequence(): number {
  createdEntityCount += 1;
  return createdEntityCount;
}

export function idFor(prefix: string, sequence: number): string {
  return `${prefix}-new-${sequence}`;
}

export function nextId(prefix: string): string {
  return idFor(prefix, nextSequence());
}

/** The brand's live dataset — a reactive clone of its seed, shared by every caller for the session. */
export function useMockData(datasetId: MockDatasetId): MockDataset {
  const existing = stores.get(datasetId);
  if (existing !== undefined) return existing;

  // `reactive` returns `UnwrapNestedRefs`, which an assertion would paper
  // over; the dataset carries no refs, so a typed local states that instead.
  const seed: MockDataset = structuredClone(SEEDS[datasetId]);
  const seeded: MockDataset = reactive(seed);
  stores.set(datasetId, seeded);
  return seeded;
}

/** Test seam: drops the live dataset so the next `useMockData` reseeds. */
export function resetMockData(datasetId: MockDatasetId): void {
  stores.delete(datasetId);
}
