<template>
  <div
    v-if="meta.isVisible"
    :class="CONTROLS_ROW_CLASS"
    v-bind="useTestAttrs({ key: 'portal-list-controls' })"
  >
    <Input
      v-if="meta.hasSearch"
      :model-value="draft"
      :placeholder="props.searchPlaceholder"
      :aria-label="props.searchLabel"
      :size="CONTROL_SIZE"
      :class="SEARCH_FIELD_CLASS"
      :data-attrs="{ 'data-test-key': 'portal-list-controls-search' }"
      @update:model-value="onType"
      @keydown.enter="onEnter"
    />

    <template v-for="filter in meta.filters" :key="filter.key">
      <Select
        v-if="filter.kind === LIST_CONTROLS_FILTER_KIND.SELECT"
        :items="selectItems(filter)"
        :model-value="selectValue(filter)"
        :aria-label="filter.label"
        :placeholder="filter.label"
        :size="CONTROL_SIZE"
        :class="FILTER_SELECT_CLASS"
        :data-attrs="{
          'data-test-key': 'portal-list-controls-filter',
          'data-filter-key': filter.key
        }"
        @update:model-value="value => onFilterSelect(filter, value)"
      />
      <ToggleGroup
        v-else-if="filter.kind === LIST_CONTROLS_FILTER_KIND.TOGGLE_GROUP"
        type="single"
        :model-value="filter.value"
        :size="CONTROL_SIZE"
        :aria-label="filter.label"
        :data-attrs="{
          'data-test-key': 'portal-list-controls-filter',
          'data-filter-key': filter.key
        }"
        @update:model-value="value => onFilterToggle(filter, value)"
      >
        <ToggleGroupItem
          v-for="option in filter.options"
          :key="option.value"
          :value="option.value"
          >{{ option.label }}</ToggleGroupItem
        >
      </ToggleGroup>
      <DatePicker
        v-else
        :model-value="dateValue(filter, RANGE_EDGE.FROM)"
        :placeholder="`${filter.label} from`"
        :class="FILTER_RANGE_CLASS"
        :data-attrs="{
          'data-test-key': 'portal-list-controls-filter',
          'data-filter-key': filter.key,
          'data-range-edge': RANGE_EDGE.FROM
        }"
        @update:model-value="
          date => onFilterDate(filter, RANGE_EDGE.FROM, date)
        "
      />
      <DatePicker
        v-if="filter.kind === LIST_CONTROLS_FILTER_KIND.DATE_RANGE"
        :model-value="dateValue(filter, RANGE_EDGE.TO)"
        :placeholder="`${filter.label} to`"
        :class="FILTER_RANGE_CLASS"
        :data-attrs="{
          'data-test-key': 'portal-list-controls-filter',
          'data-filter-key': filter.key,
          'data-range-edge': RANGE_EDGE.TO
        }"
        @update:model-value="date => onFilterDate(filter, RANGE_EDGE.TO, date)"
      />
    </template>

    <Select
      v-if="meta.hasSort"
      :items="meta.sortItems"
      :model-value="props.state?.sortValue"
      :aria-label="props.sortLabel"
      :size="CONTROL_SIZE"
      :class="SORT_SELECT_CLASS"
      :data-attrs="{ 'data-test-key': 'portal-list-controls-sort' }"
      @update:model-value="onSort"
    />

    <ToggleGroup
      v-if="meta.view"
      type="single"
      :model-value="meta.view.value"
      :size="CONTROL_SIZE"
      :aria-label="meta.view.label"
      :data-attrs="{ 'data-test-key': 'portal-list-controls-view' }"
      @update:model-value="onView"
    >
      <ToggleGroupItem
        v-for="option in meta.view.options"
        :key="option.value"
        :value="option.value"
        >{{ option.label }}</ToggleGroupItem
      >
    </ToggleGroup>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/list-controls/ListControls
 * @description The `list-controls` module — a panel's search field, filter
 * controls, sort select and view switch, over `@upmind/ui`'s `Input`,
 * `Select`, `ToggleGroup` and `DateRangePicker`. Renders; it does not decide:
 * the collection owns the query, the narrowings and the order, all arrive as
 * `state`, and every change leaves through the one `select` seam. A state
 * carrying no concern at all renders nothing.
 *
 * `concern` narrows one instance to a single part, so the control band can
 * seat the field and the order apart while both read the SAME state ref.
 * Absent, it renders every concern the state carries.
 */
import {
  DatePicker,
  Input,
  Select,
  ToggleGroup,
  ToggleGroupItem,
  useTestAttrs
} from "@upmind/ui";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  LIST_CONTROLS_CONCERN,
  LIST_CONTROLS_FILTER_ANY,
  LIST_CONTROLS_FILTER_KIND,
  LIST_CONTROLS_RANGE_SEPARATOR
} from "./types";
import {
  CONTROLS_ROW_CLASS,
  CONTROL_SIZE,
  FILTER_RANGE_CLASS,
  FILTER_SELECT_CLASS,
  SEARCH_FIELD_CLASS,
  SORT_SELECT_CLASS
} from "./variants";
import { assign, debounce, map } from "lodash-es";
import type {
  ListControlsEmits,
  ListControlsFilter,
  ListControlsProps
} from "./types";

defineOptions({ name: "PortalListControlsModule" });

const props = defineProps<ListControlsProps>();

const emit = defineEmits<ListControlsEmits>();

/** Long enough that a typed word travels as one search, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 300;

/** Named off the picker itself: the calendar's own date type lives in a package this app does not depend on. */
type PickedDate = NonNullable<
  InstanceType<typeof DatePicker>["$props"]["modelValue"]
>;

/** Which end of a period one picker sets. */
const RANGE_EDGE = {
  FROM: "from",
  TO: "to"
} as const;

type RangeEdge = (typeof RANGE_EDGE)[keyof typeof RANGE_EDGE];

const meta = computed(() => {
  const state = props.state;
  const concern = props.concern;
  const sortOptions = state?.sortOptions ?? [];
  const filters = state?.filters ?? [];
  const wants = (want: string) => concern === undefined || concern === want;
  const hasSearch =
    wants(LIST_CONTROLS_CONCERN.SEARCH) && state?.searchAction !== undefined;
  const hasSort =
    wants(LIST_CONTROLS_CONCERN.SORT) &&
    state?.sortAction !== undefined &&
    sortOptions.length > 0;
  let shownFilters: readonly ListControlsFilter[] = [];
  if (wants(LIST_CONTROLS_CONCERN.FILTERS)) shownFilters = filters;
  let view = undefined;
  if (wants(LIST_CONTROLS_CONCERN.VIEW)) view = state?.view;
  return {
    hasSearch,
    hasSort,
    filters: shownFilters,
    view,
    isVisible:
      hasSearch || hasSort || shownFilters.length > 0 || view !== undefined,
    // A fresh mutable copy: `Select`'s `items` is not readonly.
    sortItems: map(sortOptions, option => ({
      value: option.value,
      label: option.label
    }))
  };
});

const draft = ref(props.state?.searchValue ?? "");

// The field opens on the ACTIVE tab's applied query and re-seeds when a tab
// switch hands it another one — a search never follows a tab switch.
watch(
  () => props.state?.searchValue,
  applied => {
    draft.value = applied ?? "";
  }
);

/**
 * The calendar's own objects, kept per picker: a period travels to the
 * collection as two ISO dates, and rebuilding a calendar date from one needs
 * a library this app does not depend on.
 */
const pickedDates = ref<Record<string, PickedDate>>({});

function emitSearch(): void {
  const action = props.state?.searchAction;
  if (action === undefined) return;
  emit("select", `${action}:${draft.value}`);
}

const scheduleSearch = debounce(emitSearch, SEARCH_DEBOUNCE_MS);

function onType(value: unknown): void {
  draft.value = String(value ?? "");
  scheduleSearch();
}

/** Enter is the impatient path: send what is typed now, and drop the pending run. */
function onEnter(): void {
  scheduleSearch.cancel();
  emitSearch();
}

function onSort(value: unknown): void {
  const action = props.state?.sortAction;
  if (action === undefined) return;
  emit("select", `${action}:${String(value)}`);
}

function onView(value: unknown): void {
  const view = meta.value.view;
  if (view === undefined) return;
  const next = String(value ?? "");
  // A toggle group deselects on a second click; a view always shows one.
  if (next === "") return;
  emit("select", `${view.action}:${next}`);
}

/** A select always renders a row, so an unnarrowed filter shows its "any" entry. */
function selectItems(filter: ListControlsFilter) {
  return map(filter.options ?? [], option => ({
    value: option.value,
    label: option.label
  }));
}

function selectValue(filter: ListControlsFilter): string {
  if (filter.value === undefined || filter.value === "") {
    return LIST_CONTROLS_FILTER_ANY;
  }
  return filter.value;
}

function emitFilter(filter: ListControlsFilter, value: string): void {
  emit("select", `${filter.action}:${value}`);
}

function onFilterSelect(filter: ListControlsFilter, value: unknown): void {
  const chosen = String(value ?? "");
  if (chosen === LIST_CONTROLS_FILTER_ANY) {
    emitFilter(filter, "");
    return;
  }
  emitFilter(filter, chosen);
}

function onFilterToggle(filter: ListControlsFilter, value: unknown): void {
  emitFilter(filter, String(value ?? ""));
}

/** The applied period's two ends, as the collection holds them. */
function rangeBounds(filter: ListControlsFilter): Record<RangeEdge, string> {
  const [from, to] = (filter.value ?? "").split(LIST_CONTROLS_RANGE_SEPARATOR);
  return { from: from ?? "", to: to ?? "" };
}

function pickerKey(filter: ListControlsFilter, edge: RangeEdge): string {
  return `${filter.key}:${edge}`;
}

function onFilterDate(
  filter: ListControlsFilter,
  edge: RangeEdge,
  date: PickedDate | undefined
): void {
  pickedDates.value = assign({}, pickedDates.value, {
    [pickerKey(filter, edge)]: date
  });
  const bounds = assign(rangeBounds(filter), {
    [edge]: date?.toString() ?? ""
  });
  if (bounds.from === "" && bounds.to === "") {
    emitFilter(filter, "");
    return;
  }
  emitFilter(
    filter,
    [bounds.from, bounds.to].join(LIST_CONTROLS_RANGE_SEPARATOR)
  );
}

/** A picker shows a date only while the collection is narrowed by that end. */
function dateValue(
  filter: ListControlsFilter,
  edge: RangeEdge
): PickedDate | undefined {
  if (rangeBounds(filter)[edge] === "") return undefined;
  return pickedDates.value[pickerKey(filter, edge)];
}

onBeforeUnmount(() => {
  scheduleSearch.cancel();
});
</script>
