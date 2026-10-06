/**
 * Active portal-config selection (tasks.md 6.3b) — mirrors `useTheme.ts`'s
 * own shape: a name persisted to localStorage, read reactively, with a
 * MODULE-scoped ref so every consumer shares one source of truth. Adds the
 * `?config=` > explicit pick > server pin (`NUXT_PUBLIC_PORTAL_CONFIG`) >
 * default precedence, extending the `?flow=` pattern this monorepo already
 * uses for checkout mode. The server pin is what lets `pnpm dev:all` run one
 * server per shape with no query string on any URL. A SWITCHER among the three
 * shipped configs (surfaced in `PortalSettings.vue`), never the config-
 * authoring surface that was cut (parity.yaml `config-authoring`).
 *
 * `route.query?.["config"]` is read defensively — some of this app's own
 * `useRoute()` test stubs carry no `query` key at all, and a switcher that
 * throws on an absent query would take every page mounted under one down
 * with it.
 *
 * `storedConfigId` is typed `PortalConfigId`, but `useLocalStorage` only
 * ENFORCES that at the type level — a shape renamed or removed after
 * someone's browser already stored its old id, or a hand-edited storage
 * entry, both leave a plain unrecognised string sitting there at runtime.
 * `activeConfigId` therefore validates BOTH sources through the same
 * `isPortalConfigId` guard the query branch already used alone; an
 * unvalidated storage value previously passed straight through, resolving
 * `PORTAL_CONFIGS[id]` to `undefined` and rendering nothing, with no error to
 * say why.
 */
import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { PortalConfigId } from "~/portal/config";
import type { MockDatasetId } from "~/portal/mock/store";
import type { PortalConfig } from "~/portal/types";
import {
  DEFAULT_PORTAL_CONFIG_ID,
  PORTAL_CONFIGS,
  PORTAL_CONFIG_OPTIONS,
  isPortalConfigId
} from "~/portal/config";
import { withDatasetCustomAreas } from "~/portal/mock/custom-pages";
import {
  DEFAULT_MOCK_DATASET_ID,
  MOCK_DATASET_OPTIONS
} from "~/portal/mock/datasets";
import { isMockDatasetId, useMockData } from "~/portal/mock/store";
// -----------------------------------------------------------------------------

/**
 * Defaults to `null`, NOT to the default shape. `useLocalStorage` WRITES its
 * default on first read, so seeding it meant storage always held a valid id and
 * a server booted with `NUXT_PUBLIC_PORTAL_CONFIG` could never reach its own
 * pin. Absent now means "the user has not picked", which is a different fact
 * from "the user picked the default".
 */
const storedConfigId = useLocalStorage<PortalConfigId | null>(
  "upmind-portal-config",
  null
);

/**
 * The DATA the shape renders (plan R9), persisted beside the shape's own key.
 * A second axis: one shape, two datasets, so every brand gate has a dataset
 * on each side of it. Validated on read like `storedConfigId`, for the same
 * reason — a renamed dataset leaves a stale string in someone's browser.
 */
const storedDatasetId = useLocalStorage<MockDatasetId | null>(
  "upmind-portal-dataset",
  null
);

/** Dev-only, mirroring `PortalSlotContent`'s own rejection log (design.md §D5) — silent fallback is correct, silent fallback with no way to find out why is not. */
function warnUnrecognisedId(
  id: unknown,
  source: "query" | "storage" | "runtime",
  fallback: string
) {
  if (import.meta.dev) {
    console.warn(
      `[portal] unrecognised id "${String(id)}" from ${source} — falling back to "${fallback}".`
    );
  }
}

function warnUnrecognisedConfigId(
  id: unknown,
  source: "query" | "storage" | "runtime"
) {
  warnUnrecognisedId(id, source, DEFAULT_PORTAL_CONFIG_ID);
}

/**
 * The shape this server was booted as. `useRuntimeConfig` is a Nuxt
 * AUTO-IMPORT, so it must be called bare for the build to inject it — reading
 * `globalThis.useRuntimeConfig` instead finds nothing in the browser and the
 * pin silently does nothing, which is exactly how it shipped broken the first
 * time. The `typeof` guard is safe on an undeclared identifier and is there
 * for this app's own unit tests, which stub Nuxt globals rather than run Nuxt.
 */
function runtimeDefaultConfigId(): PortalConfigId | undefined {
  if (typeof useRuntimeConfig !== "function") return undefined;

  const pinned = useRuntimeConfig().public?.["portalConfig"];
  if (pinned === undefined || pinned === "") return undefined;
  if (isPortalConfigId(pinned)) return pinned;

  warnUnrecognisedConfigId(pinned, "runtime");
  return undefined;
}

export function usePortalConfig(
  route: Pick<RouteLocationNormalizedLoaded, "query"> = useRoute()
) {
  const activeConfigId = computed<PortalConfigId>(() => {
    const queryConfig = route.query?.["config"];
    if (queryConfig !== undefined) {
      if (isPortalConfigId(queryConfig)) return queryConfig;
      warnUnrecognisedConfigId(queryConfig, "query");
      return DEFAULT_PORTAL_CONFIG_ID;
    }

    // An explicit pick, made in the settings dialog, outranks the server's pin
    // — otherwise the switcher would appear broken on a pinned server.
    const stored = storedConfigId.value;
    if (stored !== null) {
      if (isPortalConfigId(stored)) return stored;
      warnUnrecognisedConfigId(stored, "storage");
    }

    // The shape this SERVER was booted as (`NUXT_PUBLIC_PORTAL_CONFIG`), so
    // three dev servers can run side by side with no query string on any URL.
    // Each port is its own origin, so their stored picks never collide either.
    const pinned = runtimeDefaultConfigId();
    if (pinned !== undefined) return pinned;

    return DEFAULT_PORTAL_CONFIG_ID;
  });

  // `?dataset=` is deliberately absent: the shape's query pin exists so one
  // dev server per shape needs no URL, and the dataset rides the same server.
  const activeDatasetId = computed<MockDatasetId>(() => {
    const stored = storedDatasetId.value;
    if (stored === null) return DEFAULT_MOCK_DATASET_ID;
    if (isMockDatasetId(stored)) return stored;
    warnUnrecognisedId(stored, "storage", DEFAULT_MOCK_DATASET_ID);
    return DEFAULT_MOCK_DATASET_ID;
  });

  /**
   * The shape's config, with the DATASET's own custom pages folded into its
   * areas (gap doc X15): a custom page is brand data, so the pages a brand
   * publishes decide which slugs resolve — `resolveCatchAll` still takes a
   * config and knows nothing about a dataset.
   */
  const activeConfig = computed<PortalConfig>(() => {
    const config = PORTAL_CONFIGS[activeConfigId.value];
    const id = activeDatasetId.value;
    if (!isMockDatasetId(id)) return config;
    return withDatasetCustomAreas(config, useMockData(id));
  });

  return {
    activeConfigId,
    activeConfig,
    options: PORTAL_CONFIG_OPTIONS,
    setConfig: (id: string) => {
      if (isPortalConfigId(id)) storedConfigId.value = id;
    },
    activeDatasetId,
    datasetOptions: MOCK_DATASET_OPTIONS,
    setDataset: (id: string) => {
      if (isMockDatasetId(id)) storedDatasetId.value = id;
    }
  };
}
