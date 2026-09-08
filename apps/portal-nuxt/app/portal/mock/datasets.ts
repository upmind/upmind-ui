// -----------------------------------------------------------------------------
/**
 * @module portal/mock/datasets
 * @description The dataset CHOICE's vocabulary (plan R9): which dataset the
 * app opens on, and how the two read in the settings dialog. Separate from
 * `store.ts`, which stays the seed registry and the id sequence alone — the
 * picker's copy is not a seed.
 */

import { MOCK_DATASET_ID } from "./store";
import type { MockDatasetId } from "./store";

export const DEFAULT_MOCK_DATASET_ID: MockDatasetId = MOCK_DATASET_ID.HOSTGRID;

export type MockDatasetOption = {
  readonly id: MockDatasetId;
  readonly label: string;
};

/** The settings dialog's dataset picker — the copy lives with the ids, never in the component. */
export const MOCK_DATASET_OPTIONS: readonly MockDatasetOption[] = [
  { id: MOCK_DATASET_ID.HOSTGRID, label: "Host·Grid — full" },
  { id: MOCK_DATASET_ID.HOSTGRID_MINIMAL, label: "Host·Grid — minimal" }
];
