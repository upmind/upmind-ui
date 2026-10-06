// -----------------------------------------------------------------------------
/**
 * @module portal/mock/collection-filters
 * @description The filter kit every paged panel's definition draws on (plan
 * R5): the control DESCRIPTORS a definition declares, the words they read in,
 * and the predicates its `source` narrows by. One implementation per question
 * — is this row in that period, in that band, on that side of a switch — so
 * eight listings ask them the same way.
 *
 * A control's `key` IS the criteria key it writes, which is the key the
 * contract's own named filter map writes: the band and the typed filters
 * reach the same narrowing from either side.
 */

import {
  LIST_CONTROLS_FILTER_ANY,
  LIST_CONTROLS_FILTER_KIND,
  LIST_CONTROLS_RANGE_SEPARATOR
} from "../modules/list-controls/types";
import {
  compact,
  filter,
  includes,
  isString,
  map,
  sortBy,
  toLower,
  uniq
} from "lodash-es";
import type {
  ListControlsFilterKind,
  ListControlsFilterOption
} from "../modules/list-controls/types";
// -----------------------------------------------------------------------------

/**
 * One narrowing a panel offers, as its definition declares it. The applied
 * value and the action value are the SELECTOR's to add — a definition knows
 * the question, not which collection instance is asking it.
 */
export type MockFilterControl = {
  readonly key: string;
  readonly label: string;
  readonly kind: ListControlsFilterKind;
  readonly options?: readonly ListControlsFilterOption[];
};

/** Both sides of a yes/no switch — the value a toggle filter carries. */
export const MOCK_FILTER_FLAG = {
  YES: "yes",
  NO: "no"
} as const;

export type MockFilterFlag =
  (typeof MOCK_FILTER_FLAG)[keyof typeof MOCK_FILTER_FLAG];

/** Legacy's delegate access split — everything, or the objects named for them. */
export const MOCK_ACCESS_TYPE = {
  FULL: "full",
  SPECIFIC: "specific"
} as const;

export type MockAccessType =
  (typeof MOCK_ACCESS_TYPE)[keyof typeof MOCK_ACCESS_TYPE];

// -----------------------------------------------------------------------------
// Descriptors
// -----------------------------------------------------------------------------

/**
 * A select of named values. `anyLabel` heads the list as the unnarrowed row —
 * a select always shows something, so "no filter" has to read as a choice.
 */
export function selectFilter(
  key: string,
  label: string,
  anyLabel: string,
  options: readonly ListControlsFilterOption[]
): MockFilterControl {
  return {
    key,
    label,
    kind: LIST_CONTROLS_FILTER_KIND.SELECT,
    options: [{ value: LIST_CONTROLS_FILTER_ANY, label: anyLabel }, ...options]
  };
}

/** A two-sided switch; clicking the showing side clears it, as a toggle group does. */
export function toggleFilter(
  key: string,
  label: string,
  options: readonly ListControlsFilterOption[]
): MockFilterControl {
  return { key, label, kind: LIST_CONTROLS_FILTER_KIND.TOGGLE_GROUP, options };
}

export function dateRangeFilter(key: string, label: string): MockFilterControl {
  return { key, label, kind: LIST_CONTROLS_FILTER_KIND.DATE_RANGE };
}

/**
 * The options a filter offers over the rows the panel actually HOLDS — a
 * status no seed uses would be a dead choice, and one option is no choice at
 * all, so a single-valued column offers none.
 */
export function optionsPresent<TValue extends string>(
  values: readonly TValue[],
  labelOf: (value: TValue) => string
): ListControlsFilterOption[] {
  const present = sortBy(uniq(values));
  if (present.length < 2) return [];
  return map(present, value => ({ value, label: labelOf(value) }));
}

/** A yes/no filter's two sides, worded for the question it asks. */
export function flagOptions(
  yesLabel: string,
  noLabel: string
): ListControlsFilterOption[] {
  return [
    { value: MOCK_FILTER_FLAG.YES, label: yesLabel },
    { value: MOCK_FILTER_FLAG.NO, label: noLabel }
  ];
}

// -----------------------------------------------------------------------------
// Predicates
// -----------------------------------------------------------------------------

/** An absent criteria value narrows nothing — every predicate below opens with this. */
/** The narrowing a criteria key actually asks for; an empty or absent one asks nothing. */
export function appliedValue(criteriaValue: unknown): string | undefined {
  if (!isString(criteriaValue) || criteriaValue === "") return undefined;
  return criteriaValue;
}

/**
 * Whether a day is on or after the bound asked for — one END of a window,
 * where `matchesDateRange` takes both at once. Legacy published its period
 * filters this way (`data/filters/creditStatements.ts`: `from_date` and
 * `to_date`, one control each). ISO `YYYY-MM-DD` throughout, so the string
 * order IS the date order.
 */
export function matchesFrom(day: string, criteriaValue: unknown): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  return day >= wanted;
}

/** Whether a day is on or before the bound asked for — the other end. */
export function matchesUntil(day: string, criteriaValue: unknown): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  return day <= wanted;
}

/**
 * Whether a value CONTAINS what was asked for, case-insensitively — legacy's
 * `FilterOperators.CONTAINS`, which its reference and subject filters used.
 * The band spells free text as one search box; a module's own named setter
 * narrows one column, and this is the comparison it makes.
 */
export function matchesContains(
  actual: string | undefined,
  criteriaValue: unknown
): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  if (actual === undefined) return false;
  return includes(toLower(actual), toLower(wanted));
}

export function matchesExact(
  actual: string | undefined,
  criteriaValue: unknown
): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  return actual === wanted;
}

export function matchesFlag(flag: boolean, criteriaValue: unknown): boolean {
  const wanted = wantedFlag(criteriaValue);
  if (wanted === undefined) return true;
  return flag === wanted;
}

/**
 * What a flag narrowing was asked for, as ONE representation. Two callers
 * write these keys and they spell the answer differently: the band writes its
 * option's own value (`"yes"` / `"no"`), while a module's named setter writes
 * the contract's BOOLEAN (`filters.successful(true)`). Both meet here, so the
 * row is compared once — a matcher that understood only the band's spelling
 * left every published setter inert.
 */
function wantedFlag(criteriaValue: unknown): boolean | undefined {
  if (typeof criteriaValue === "boolean") return criteriaValue;
  const wanted = appliedValue(criteriaValue);
  if (wanted === MOCK_FILTER_FLAG.YES) return true;
  if (wanted === MOCK_FILTER_FLAG.NO) return false;
  return undefined;
}

/**
 * A period, both ends inclusive, over ISO dates. The row's date may be a full
 * stamp; only the day is compared, so a same-day row is inside its own range.
 */
export function matchesDateRange(
  date: string | undefined,
  criteriaValue: unknown
): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  if (date === undefined) return false;
  const [from, to] = wanted.split(LIST_CONTROLS_RANGE_SEPARATOR);
  const day = date.slice(0, 10);
  if (from !== undefined && from !== "" && day < from) return false;
  if (to !== undefined && to !== "" && day > to) return false;
  return true;
}

/** One authored band of amounts — the mock stands in for the server, so it compares figures. */
type AmountBand = {
  readonly value: string;
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
};

/**
 * Legacy's price bands, authored: a client asks "what costs under £25", never
 * "what costs between 24.99 and 25.00". The upper bound is exclusive so the
 * bands tile the line without overlap.
 */
const AMOUNT_BANDS: readonly AmountBand[] = [
  { value: "under-25", label: "Under £25", max: 25 },
  { value: "25-100", label: "£25 to £100", min: 25, max: 100 },
  { value: "100-500", label: "£100 to £500", min: 100, max: 500 },
  { value: "500-plus", label: "£500 and over", min: 500 }
];

export const AMOUNT_BAND_OPTIONS: readonly ListControlsFilterOption[] = map(
  AMOUNT_BANDS,
  band => ({ value: band.value, label: band.label })
);

export function matchesAmountBand(
  amount: number | undefined,
  criteriaValue: unknown
): boolean {
  return matchesBand(AMOUNT_BANDS, amount, criteriaValue);
}

/** The comparison every authored band shares: an unknown band narrows nothing. */
function matchesBand(
  bands: readonly (AmountBand | CountBand)[],
  figure: number | undefined,
  criteriaValue: unknown
): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  const band = filter(bands, { value: wanted })[0];
  if (band === undefined) return true;
  if (figure === undefined) return false;
  if (band.min !== undefined && figure < band.min) return false;
  if (band.max !== undefined && figure >= band.max) return false;
  return true;
}

/**
 * Whether a row's SET of values holds the one asked for — legacy's
 * multi-valued filters (a product's service tags) narrow by membership rather
 * than by equality.
 */
export function matchesAny(
  values: readonly string[] | undefined,
  criteriaValue: unknown
): boolean {
  const wanted = appliedValue(criteriaValue);
  if (wanted === undefined) return true;
  return includes(values, wanted);
}

/**
 * One authored band of COUNTS. The same three members an amount band carries,
 * under its own name: a count is a whole number of things rather than a sum
 * of money, and the two sets of bands are never interchangeable.
 */
type CountBand = {
  readonly value: string;
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
};

/**
 * Legacy filtered counts by an exact number (`affiliate.ts:20-31`), which no
 * client ever asks for — "which links brought anyone in" is the question, so
 * the counts band the same way amounts do. The upper bound is exclusive, as
 * an amount band's is, so each band's value names the range it covers.
 */
const COUNT_BANDS: readonly CountBand[] = [
  { value: "none", label: "None", max: 1 },
  { value: "1-10", label: "1 to 10", min: 1, max: 11 },
  { value: "11-50", label: "11 to 50", min: 11, max: 51 },
  { value: "over-50", label: "Over 50", min: 51 }
];

export const COUNT_BAND_OPTIONS: readonly ListControlsFilterOption[] = map(
  COUNT_BANDS,
  band => ({ value: band.value, label: band.label })
);

export function matchesCountBand(
  count: number | undefined,
  criteriaValue: unknown
): boolean {
  return matchesBand(COUNT_BANDS, count, criteriaValue);
}

/** Drops the controls a panel ends up offering no choice in (an empty option set). */
export function presentControls(
  controls: readonly (MockFilterControl | false)[]
): MockFilterControl[] {
  return filter(
    compact(controls),
    control =>
      control.kind === LIST_CONTROLS_FILTER_KIND.DATE_RANGE ||
      (control.options?.length ?? 0) > 1
  );
}
