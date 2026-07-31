import { computed } from "vue";
import { useBrand } from "../brand";
import { useSystem } from "../system";
import { useSchema, useUischema } from "./client-phone-dry.schemas";
import { DEFAULT_PHONE_TYPE } from "./client-phone-dry.types";
import { canEdit, isStaged } from "./client-phone-dry.utils";
import { useCollection } from "../../utils";
import { castArray } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type {
  Phone,
  PhoneModel,
  ClientPhoneDryListQuery
} from "./client-phone-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/useClientPhonesDry.context
 * @description Reactive list + form-seed context. Armless — identical shape
 * across both cells (design.md §7: "no parity row gives an actor an
 * exclusive/overriding computed value").
 */

export function createClientPhoneDryContext(
  _actorScope: ScopeActorTypes,
  query: ClientPhoneDryListQuery,
  brandId: string | undefined
) {
  const { findOne, getOne, getDefault } = useCollection<Phone>(query.data);
  const { getCountry, ensureCountries } = useSystem();
  const { countryId: activeBrandCountryId } = useBrand();

  // Kicks off the countries fetch once; `country`/`schema`/`model` below are
  // reactive and settle automatically when it resolves.
  ensureCountries();

  const data = computed(() => castArray(query.data.value ?? []));

  /**
   * D3 — seeds from the `.inBrand()` filter's brand when one is set, else the
   * existing system/model fallback (`getCountry()`'s own default).
   * @decision
   * what: when `brandId` (this scope's `.inBrand()` filter, ADR-001 §7 — a
   *   filter, not a context) is set, seed from `useBrand().countryId` — the
   *   only brand this headless app instance can resolve country data for.
   * why: legacy seeds from `brand.country_id` unconditionally
   *   (`addEditClientPhoneModal.vue:121`, `this.$store.state.brand.country_id`)
   *   because vue-app has exactly one active brand per session, same as this
   *   headless instance (`brand/useBrand.ts` is a session-wide singleton, no
   *   by-id lookup for an arbitrary OTHER brand exists anywhere in headless).
   *   `.inBrand(id)` naming a brand other than the active one has no data
   *   source to resolve against in this codebase today.
   * rejected: building a by-id brand-fetch to honour an arbitrary `.inBrand()`
   *   target — a real gap, but `brand/` is a shared sibling module outside
   *   this smoke test's file list (design.md §4); surfaced, not silently
   *   built around.
   */
  const country = computed(() =>
    getCountry(brandId ? activeBrandCountryId.value : undefined)
  );

  const lookups = computed(() => ({ country: country.value }));

  const model = computed<PhoneModel>(() => ({
    phone: {
      number: null,
      nationalNumber: null,
      countryCallingCode: null,
      country: country.value?.code ?? null
    },
    type: DEFAULT_PHONE_TYPE
  }));

  const schema = computed(() => useSchema({ country: country.value }));
  const uischema = computed(() => useUischema());

  return {
    /** The reactive list (always an array). */
    data,

    /** The client's default phone, if any. */
    default: getDefault,

    /** The list query's current error state, if any. */
    error: query.error,

    /** Finds a single phone by a partial mapping. */
    findOne,

    /** Finds a single phone by id. */
    getOne,

    /** Country lookup used to seed/format the form (D3). */
    lookups,

    /** New-phone form model seed (country from D3, `type` defaulted). */
    model,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /** The add/edit form JSON Schema (D2 — `type` required). */
    schema,

    /** The add/edit form UI Schema. */
    uischema,

    /** D4 — true for a staged-import row. */
    isStaged,

    /** D4 — false while `isStaged(phone)`; gates edit/set-default/delete. */
    canEdit
  };
}

// Type export for consumers
export type UseClientPhonesDryContext = ReturnType<
  typeof createClientPhoneDryContext
>;
