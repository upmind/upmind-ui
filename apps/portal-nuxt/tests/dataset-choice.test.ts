// -----------------------------------------------------------------------------
/**
 * @module tests/dataset-choice
 * @description Plan R9: the DATA the shape renders is a second axis, picked
 * in the settings dialog and persisted beside the shape's own key. The picker
 * is graded on the axis it owns — a dataset choice that only ever returns the
 * default, or one that persists nowhere, fails here.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { map, uniq } from "lodash-es";
import { DEFAULT_MOCK_DATASET_ID } from "~/portal/mock/datasets";
import { MOCK_DATASET_ID } from "~/portal/mock/store";

const STORAGE_KEY = "upmind-portal-dataset";

/** The non-default choice — the only value that can prove a pick was honoured. */
const OTHER_DATASET_ID =
  DEFAULT_MOCK_DATASET_ID === MOCK_DATASET_ID.HOSTGRID
    ? MOCK_DATASET_ID.HOSTGRID_MINIMAL
    : MOCK_DATASET_ID.HOSTGRID;

function stubRoute() {
  Object.assign(globalThis, { useRoute: () => ({ path: "/", query: {} }) });
}

/** `storedDatasetId` is module-scoped, so each case needs its own module graph. */
async function loadUsePortalConfig() {
  vi.resetModules();
  return import("~/composables/usePortalConfig");
}

describe("dataset choice — R9's second axis", () => {
  beforeEach(() => {
    localStorage.clear();
    stubRoute();
  });
  afterEach(() => {
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("offers both shipped datasets, each with its own label", async () => {
    const { usePortalConfig } = await loadUsePortalConfig();
    const { datasetOptions } = usePortalConfig();

    expect(map(datasetOptions, option => option.id).sort()).toEqual(
      [MOCK_DATASET_ID.HOSTGRID, MOCK_DATASET_ID.HOSTGRID_MINIMAL].sort()
    );
    const labels = map(datasetOptions, option => option.label);
    expect(uniq(labels).length).toBe(labels.length);
    expect(labels.every(label => label.trim().length > 0)).toBe(true);
  });

  it("opens on the default when nothing has been picked", async () => {
    const { usePortalConfig } = await loadUsePortalConfig();

    expect(usePortalConfig().activeDatasetId.value).toBe(
      DEFAULT_MOCK_DATASET_ID
    );
  });

  it("a pick changes the active dataset and persists under the dataset key", async () => {
    const { usePortalConfig } = await loadUsePortalConfig();
    const config = usePortalConfig();

    config.setDataset(OTHER_DATASET_ID);
    await nextTick();

    expect(config.activeDatasetId.value).toBe(OTHER_DATASET_ID);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(OTHER_DATASET_ID);
    // The shape's own key is a separate axis and must not have moved.
    expect(localStorage.getItem("upmind-portal-config")).toBeNull();
  });

  it("a stored dataset is read back on the next load", async () => {
    localStorage.setItem(STORAGE_KEY, OTHER_DATASET_ID);
    const { usePortalConfig } = await loadUsePortalConfig();

    expect(usePortalConfig().activeDatasetId.value).toBe(OTHER_DATASET_ID);
  });

  it("an unrecognised stored value falls back to the default rather than standing as the active id", async () => {
    localStorage.setItem(STORAGE_KEY, "not-a-dataset");
    const { usePortalConfig } = await loadUsePortalConfig();

    let active: string | undefined;
    expect(() => {
      active = usePortalConfig().activeDatasetId.value;
    }).not.toThrow();
    expect(active).toBe(DEFAULT_MOCK_DATASET_ID);
  });

  it("a pick the storage refuses to hold still takes effect in the session", async () => {
    const { usePortalConfig } = await loadUsePortalConfig();
    const config = usePortalConfig();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    expect(() => config.setDataset(OTHER_DATASET_ID)).not.toThrow();
    await expect(nextTick()).resolves.not.toThrow();
    expect(config.activeDatasetId.value).toBe(OTHER_DATASET_ID);
  });

  it("ignores an id that names no dataset", async () => {
    const { usePortalConfig } = await loadUsePortalConfig();
    const config = usePortalConfig();

    config.setDataset("not-a-dataset");
    await nextTick();

    expect(config.activeDatasetId.value).toBe(DEFAULT_MOCK_DATASET_ID);
  });
});
