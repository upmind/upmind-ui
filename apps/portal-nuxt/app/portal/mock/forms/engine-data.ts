// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/engine-data
 * @description The reference data the form renderers cannot derive from a
 * schema (plan F7) — the BE-served lists the real app fetches, as a static
 * fixture. The layout provides it once, before any form mounts
 * (`provideFormEngineData`, `@upmind/ui` `src/form/README.md`); absent it the
 * phone control's country picker lists nothing, silently.
 *
 * Twelve countries, not a full ISO table: enough for every seeded address and
 * dialling code, and a list a reader can scan in a picker.
 */

import { computed } from "vue";
import { SEED_ALTERNATE_CURRENCY, SEED_CURRENCY } from "../hostgrid.filler";
import { find, map } from "lodash-es";
import type { FormCountry, FormEngineData } from "@upmind/ui";
import type { ICountry, ILanguage, IRegion } from "@upmind-automation/types";

/** The wire timestamps every reference row carries; a fixture fetches nothing. */
const SEEDED_AT = "2024-01-01T00:00:00Z";
const SEEDED_AT_EPOCH = 0;

/** One country as the ADDRESS schema needs it — the phone control reads a subset. */
function country(
  code: string,
  name: string,
  phoneCode: string,
  eea: number
): ICountry {
  return {
    id: code,
    code,
    name,
    phone_code: phoneCode,
    eea,
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT_EPOCH
  };
}

const EEA = 1;
const NON_EEA = 0;

export const PORTAL_FORM_COUNTRIES: readonly ICountry[] = [
  country("GB", "United Kingdom", "44", NON_EEA),
  country("IE", "Ireland", "353", EEA),
  country("US", "United States", "1", NON_EEA),
  country("CA", "Canada", "1", NON_EEA),
  country("FR", "France", "33", EEA),
  country("DE", "Germany", "49", EEA),
  country("ES", "Spain", "34", EEA),
  country("IT", "Italy", "39", EEA),
  country("NL", "Netherlands", "31", EEA),
  country("PT", "Portugal", "351", EEA),
  country("AU", "Australia", "61", NON_EEA),
  country("NZ", "New Zealand", "64", NON_EEA)
];

/**
 * The regions a handful of countries publish — the list `client-address`'s own
 * schema turns into the Region picker's enum, and the reason
 * `REQUIRE_REGION_IN_ADDRESS` has anything to require. Four countries, not a
 * full subdivision table: enough that the picker has both a populated and an
 * empty branch to render.
 */
function region(countryId: string, code: string, name: string): IRegion {
  return { id: `${countryId}-${code}`, country_id: countryId, code, name };
}

const PORTAL_FORM_REGIONS: Readonly<Record<string, readonly IRegion[]>> = {
  GB: [
    region("GB", "ENG", "England"),
    region("GB", "SCT", "Scotland"),
    region("GB", "WLS", "Wales"),
    region("GB", "NIR", "Northern Ireland")
  ],
  US: [
    region("US", "CA", "California"),
    region("US", "NY", "New York"),
    region("US", "TX", "Texas"),
    region("US", "WA", "Washington")
  ],
  CA: [
    region("CA", "ON", "Ontario"),
    region("CA", "QC", "Quebec"),
    region("CA", "BC", "British Columbia")
  ],
  AU: [
    region("AU", "NSW", "New South Wales"),
    region("AU", "VIC", "Victoria"),
    region("AU", "QLD", "Queensland")
  ]
};

/** The regions one country publishes — none, for a country that names no subdivision. */
export function regionsFor(countryId: string | null | undefined): IRegion[] {
  if (countryId === null || countryId === undefined) return [];
  return [...(PORTAL_FORM_REGIONS[countryId] ?? [])];
}

/** What an address row prints beside its lines; an unknown id prints as itself. */
export function countryName(id: string | null | undefined): string {
  if (id === null || id === undefined) return "";
  return find(PORTAL_FORM_COUNTRIES, { id })?.name ?? id;
}

/**
 * The currencies the datasets actually trade in — what a money field's own
 * schema enumerates. It rides no provider: the design system's
 * `FormEngineData` carries countries alone, so a currency select reads this
 * list from its schema instead (recorded in the phase report).
 */
export const PORTAL_FORM_CURRENCIES: readonly string[] = [
  SEED_CURRENCY,
  SEED_ALTERNATE_CURRENCY
];

/** The engine's reference data, already resolved — a mock fetches nothing. */
export function portalFormEngineData(): FormEngineData {
  return {
    countries: computed<FormCountry[]>(() =>
      map(PORTAL_FORM_COUNTRIES, ({ id, code, name, phone_code }) => ({
        id,
        code,
        name,
        phone_code
      }))
    ),
    ensureCountries: () => undefined
  };
}

/**
 * The interface languages the brand publishes — the profile schema's own
 * `lookups.languages`, and the display name every read-only profile row
 * prints beside a stored language id. The wire carries timestamps the form
 * never reads; the fixture carries them because the model does.
 */
export const PORTAL_FORM_LANGUAGES: readonly ILanguage[] = [
  {
    id: "en",
    code: "en",
    language: "English",
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT
  },
  {
    id: "fr",
    code: "fr",
    language: "Français",
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT
  },
  {
    id: "de",
    code: "de",
    language: "Deutsch",
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT
  },
  {
    id: "es",
    code: "es",
    language: "Español",
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT
  }
];

/** An id the brand does not publish prints as itself rather than as nothing. */
export function interfaceLanguageLabel(id: string): string {
  return find(PORTAL_FORM_LANGUAGES, { id })?.language ?? id;
}
