/** @internal */
import { Store } from "@tanstack/vue-store";
import { localStoragePersister, useQuery } from "../query";
import {
  defaultBrandConfigKeys,
  defaultOrgFeatureKeys
} from "./brand.constants";
import { mapBrandConfig, mapBrandSettings } from "./brand.mappers";
import { useQuerySchema } from "./brand.schemas";
import { castArray, difference, pick, uniq } from "lodash-es";
import type { QueryModel } from "./brand.types";
import type { IUpmindModule, IBrandSettings } from "@upmind-automation/types";
import type { OrgFeatureKeys, BrandConfigKeys } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

// --- types

// -----------------------------------------------------------------------------

const brandConfigKeysStore = new Store<BrandConfigKeys[]>([]);

function fetchBrandSettings() {
  const { query, useUrl } = useQuery();

  return query<IBrandSettings, IBrandSettings>({
    url: useUrl("brand/settings"),
    queryKey: ["brand", "settings"],
    // --- options
    staleTime: "static",
    // A 5xx here means the brand doesn't exist — a deterministic answer, not a
    // transient fault. Retrying it blocks the unavailable-tenant redirect in init.
    retry: false,
    persister: localStoragePersister.persisterFn,
    select: mapBrandSettings
  });
}

/**
 * Registers the append-only brand-config query under one stable queryKey; the
 * `keys=` param is written at request time so the single cached entry widens.
 *
 * @param keys - Brand config keys to add to the requested set. Defaults to the core set.
 */
function fetchBrandConfig(keys: BrandConfigKeys[] = defaultBrandConfigKeys) {
  const { query, useUrl } = useQuery();

  brandConfigKeysStore.setState(uniq([...brandConfigKeysStore.state, ...keys]));

  const url = useUrl("config/brand/values");

  return query<
    Record<BrandConfigKeys, unknown>,
    Record<BrandConfigKeys, unknown>,
    QueryModel
  >({
    url,
    guard: async () => {
      url.searchParams.set("keys", brandConfigKeysStore.state.join());
      return true;
    },
    queryKey: ["brand", "config"],
    criteria: { schema: useQuerySchema() },
    select: data => mapBrandConfig(data, brandConfigKeysStore.state),
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

/**
 * Ensures `keys` are answered by the brand config, and resolves once they are;
 * a genuinely new key forces the one refetch that re-requests the widened set,
 * a key already held resolves from the cached entry without a request.
 *
 * @param keys - Brand config keys to ensure are fetched.
 */
async function ensureBrandConfig(keys: BrandConfigKeys | BrandConfigKeys[]) {
  const safekeys = castArray(keys) as BrandConfigKeys[];
  const isWidened = difference(safekeys, brandConfigKeysStore.state).length > 0;
  const result = fetchBrandConfig(safekeys);
  if (isWidened) await result.refetch();
  else await result.promise.value;
  return pick(result.data.value, safekeys);
}

function fetchModules() {
  const { query, useUrl } = useQuery();

  return query<IUpmindModule[]>({
    url: useUrl("org/modules"),
    queryKey: ["brand", "modules"],
    // --- options
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

function fetchOrganisationConfig() {
  const { query, useUrl } = useQuery();

  return query<Record<OrgFeatureKeys, unknown>>({
    url: useUrl("config/organisation/values", {
      keys: defaultOrgFeatureKeys.join()
    }),
    queryKey: [
      "brand",
      "organisation",
      "config",
      { keys: defaultOrgFeatureKeys }
    ],
    // --- options
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

// -----------------------------------------------------------------------------

export default {
  ensureBrandConfig,
  fetchBrandConfig,
  fetchBrandSettings,
  fetchModules,
  fetchOrganisationConfig
};
