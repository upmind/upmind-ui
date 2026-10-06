// -----------------------------------------------------------------------------
/**
 * @module portal/modules/list-controls/types
 * @description Prop contract for the `list-controls` module — a panel header's
 * search field, filter controls, sort select and view switch, over
 * `@upmind/ui`'s `Input`, `Select`, `ToggleGroup` and `DateRangePicker`.
 * One object prop because `resolveDataRefProps` resolves refs per prop VALUE:
 * a built object needs a single prop to land in (the pagination pattern).
 */

/**
 * Which part of the controls one instance renders. The band seats them apart
 * — the field and the filters left, the order and the view right — so each
 * position mounts the module for its own concern against the SAME state ref.
 */
export const LIST_CONTROLS_CONCERN = {
  SEARCH: "search",
  FILTERS: "filters",
  SORT: "sort",
  VIEW: "view"
} as const;

export type ListControlsConcern =
  (typeof LIST_CONTROLS_CONCERN)[keyof typeof LIST_CONTROLS_CONCERN];

/** How one filter asks its question — the control the band renders for it. */
export const LIST_CONTROLS_FILTER_KIND = {
  SELECT: "select",
  TOGGLE_GROUP: "toggle-group",
  DATE_RANGE: "date-range"
} as const;

export type ListControlsFilterKind =
  (typeof LIST_CONTROLS_FILTER_KIND)[keyof typeof LIST_CONTROLS_FILTER_KIND];

/**
 * The "no narrowing" entry a select opens on. reka's `SelectItem` throws on an
 * empty-string value, so the unnarrowed row carries this instead and the
 * module emits the empty tail — which every collection already reads as clear.
 */
export const LIST_CONTROLS_FILTER_ANY = "any";

/** The two halves of a date-range value, joined — `2026-01-01..2026-03-31`. */
export const LIST_CONTROLS_RANGE_SEPARATOR = "..";

export type ListControlsFilterOption = {
  readonly value: string;
  readonly label: string;
};

/**
 * One narrowing the panel offers. The selector authors every word of it; the
 * module renders the control its `kind` names and emits `${action}:${value}`,
 * an empty value clearing.
 */
export type ListControlsFilter = {
  /** The collection's own filter key — the criteria this control writes. */
  readonly key: string;
  /** Its visible name, and the control's accessible name. */
  readonly label: string;
  readonly kind: ListControlsFilterKind;
  /** `select` and `toggle-group` render these verbatim; a date range has none. */
  readonly options?: readonly ListControlsFilterOption[];
  /** The applied value, "" when the filter is not narrowing. */
  readonly value?: string;
  /** Emit prefix `collection-filter:<collectionId>:<key>`; the module appends `:<value>`. */
  readonly action: string;
};

export type ListControlsSortOption = {
  readonly value: string;
  readonly label: string;
};

/** The grid/table switch legacy put over its products listing. */
export type ListControlsView = {
  /** The showing view's value. */
  readonly value: string;
  /** Emit prefix `set-view`; the module appends `:<value>`. */
  readonly action: string;
  /** Accessible name for the switch. The selector authors it (CC22). */
  readonly label: string;
  readonly options: readonly ListControlsFilterOption[];
};

export type ListControlsState = {
  /** The applied query the field opens with — the ACTIVE tab's own. */
  readonly searchValue?: string;
  /** Emit prefix for search: `collection-search:<id>`; the module appends `:<text>`. */
  readonly searchAction?: string;
  /** The panel's narrowings, in render order. Absent renders no filter control. */
  readonly filters?: readonly ListControlsFilter[];
  /** The active sort option's value, "" for seed order. */
  readonly sortValue?: string;
  /** Emit prefix for sort: `collection-sort:<id>`; the module appends `:<value>`. */
  readonly sortAction?: string;
  /** Rendered verbatim; the selector authors them, default entry included. */
  readonly sortOptions?: readonly ListControlsSortOption[];
  /** The view switch, on the one listing that offers it. */
  readonly view?: ListControlsView;
};

export type ListControlsProps = {
  /** The live feed; absent (or empty of every concern) renders nothing. */
  readonly state?: ListControlsState;
  /** Renders this concern alone. Absent renders every one the state carries. */
  readonly concern?: ListControlsConcern;
  readonly searchPlaceholder?: string;
  /** Accessible name for the search field. No English default (CC22). */
  readonly searchLabel: string;
  /** Accessible name for the sort select. No English default (CC22). */
  readonly sortLabel: string;
};

export type ListControlsEmits = {
  /** An action value — the same seam every module's actions ride. */
  select: [value: string];
};
