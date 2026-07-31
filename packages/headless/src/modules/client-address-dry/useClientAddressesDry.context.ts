import { computed, ref } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useSchema, useUischema } from "./client-address-dry.schemas";
import { DEFAULT_ADDRESS_TYPE } from "./client-address-dry.types";
import { useCollection } from "../../utils";
import { castArray, get } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type {
  Address,
  AddressModel,
  ClientAddressDryListQuery,
  ClientAddressDryServices
} from "./client-address-dry.types";
import type { ICountry, IRegion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry.context
 * @description Reactive list + form-seed context. Armless — identical shape
 * across all three cells (design.md §7: "no parity row gives an actor an
 * exclusive/overriding computed value").
 *
 * @doctrine `service.loadLookups` (R11/R12) is invoked once at construction
 * and its result folded into local refs — this composable has no machine to
 * assign into, so the reactive seed lives here instead of in a shared
 * invoke-transition (query variant, `code-composables.md` Part B "State
 * Machine vs TanStack Query").
 */
export function createClientAddressDryContext(
  _actorScope: ScopeActorTypes,
  service: ClientAddressDryServices,
  query: ClientAddressDryListQuery,
  _brandId: string | undefined
) {
  const { findOne, getOne, getDefault } = useCollection<Address>(query.data);

  const data = computed(() => castArray(query.data.value ?? []));

  const countries = ref<ICountry[]>([]);
  const regions = ref<IRegion[]>([]);
  const country = ref<ICountry | undefined>(undefined);
  const config = ref<Record<string, unknown>>({});
  const model = ref<AddressModel>({
    address: {
      countryId: undefined,
      address1: null,
      city: null,
      postcode: null
    },
    type: DEFAULT_ADDRESS_TYPE
  });

  service
    .loadLookups({ model: model.value })
    .then(result => {
      countries.value = result.countries ?? [];
      regions.value = result.regions ?? [];
      country.value = result.country;
      config.value = result.config ?? {};
      if (result.model) model.value = result.model;
    })
    .catch(() => undefined);

  const lookups = computed(() => ({
    countries: countries.value,
    regions: regions.value,
    country: country.value
  }));

  /** R12 — reactive, brand-config-driven (shared, not actor). */
  const requireRegion = computed(
    () => !!get(config.value, BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS)
  );

  const schema = computed(() =>
    useSchema({
      baseModel: model.value,
      countries: countries.value,
      regions: regions.value,
      requireRegion: requireRegion.value
    })
  );

  const uischema = computed(() => useUischema());

  return {
    /** The reactive list (always an array). */
    data,

    /** The client's default address, if any (AC-CART checkout-coupling shape). */
    default: getDefault,

    /** The list query's current error state, if any. */
    error: query.error,

    /** Finds a single address by a partial mapping. */
    findOne,

    /** Finds a single address by id. */
    getOne,

    /** Country/region lookups used to seed/format the form (R11). */
    lookups,

    /** New-address form model seed (`type` defaulted — D-ADDR-3). */
    model,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /** The add/edit form JSON Schema (D-ADDR-3 `type` + R12 region rule). */
    schema,

    /** The add/edit form UI Schema. */
    uischema
  };
}

// Type export for consumers
export type UseClientAddressesDryContext = ReturnType<
  typeof createClientAddressDryContext
>;
