/** @internal */
import { Store } from "@tanstack/vue-store";
import { localStoragePersister, useQuery } from "../query";
import {
  defaultBrandConfigKeys,
  defaultOrgFeatureKeys
} from "./brand.constants";
import { mapBrandConfig, mapBrandSettings } from "./brand.mappers";
import { useQuerySchema } from "./brand.schemas";
import { castArray, pick, uniq } from "lodash-es";
import type { QueryModel } from "./brand.types";
import type { IUpmindModule, IBrandSettings } from "@upmind-automation/types";
import type { OrgFeatureKeys, BrandConfigKeys } from "@upmind-automation/types";

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
 * Registers the brand-config query for the ACCUMULATED key set — never for
 * `keys` alone.
 *
 * Keys are append-only — they accumulate in `brandConfigKeysStore` across calls
 * and are never removed, so every call requests a superset of all previously
 * requested keys, `keys` included.
 *
 * The key list rides the CRITERIA, reaching the wire as `filter[keys|eq]=a,b,c`
 * (`translateQuery` joins the array). The `queryKey` below is the CONSTANT
 * `["brand", "config"]`; distinct key-sets stay distinct cache entries anyway,
 * because `query()` appends its own `{ sort, filters, query }` object as the
 * key's last element and the translated `filter[keys|eq]` string sits in it. A
 * widened set is therefore a fresh entry rather than one entry silently reused
 * for a different question.
 *
 * @param keys - Brand config keys to add to the requested set. Defaults to the core set.
 */
function fetchBrandConfig(keys: BrandConfigKeys[] = defaultBrandConfigKeys) {
  const { query, useUrl } = useQuery();

  brandConfigKeysStore.setState(uniq([...brandConfigKeysStore.state, ...keys]));

  return query<
    Record<BrandConfigKeys, unknown>,
    Record<BrandConfigKeys, unknown>,
    QueryModel
  >({
    url: useUrl("config/brand/values"),
    queryKey: ["brand", "config"],
    criteria: {
      schema: useQuerySchema(),
      model: { filters: { keys: { eq: brandConfigKeysStore.state } } }
    },
    select: data => mapBrandConfig(data, brandConfigKeysStore.state),
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

/**
 * Ensures `keys` are answered by the brand config, and resolves once they are.
 *
 * @param keys - Brand config keys to ensure are fetched.
 */
async function ensureBrandConfig(keys: BrandConfigKeys | BrandConfigKeys[]) {
  const safekeys = castArray(keys) as BrandConfigKeys[];
  const result = fetchBrandConfig(safekeys);
  await result.promise.value;
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
