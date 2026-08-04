<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else class="space-y-4">
    <Alert
      v-if="isEmpty && hasActiveFilters"
      variant="minimal"
      icon="search-lg"
      title="No matching rows"
      description="No rows match the active filters."
    />
    <Alert
      v-else-if="isEmpty"
      variant="minimal"
      icon="inbox-01"
      title="No data"
      description="This collection is empty."
    />

    <table v-else class="w-full text-left text-sm">
      <thead>
        <tr
          v-for="headerGroup in vueTable.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="border-surface border-b p-2 align-top font-semibold"
          >
            <template v-if="!header.isPlaceholder">
              <button
                v-if="header.column.getCanSort()"
                type="button"
                class="flex items-center gap-1"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                {{ header.column.columnDef.header }}
                <Icon
                  :icon="sortIcon(header.column.getIsSorted())"
                  size="2xs"
                />
              </button>
              <span v-else>{{ header.column.columnDef.header }}</span>

              <Input
                v-if="header.column.getCanFilter()"
                class="mt-1"
                placeholder="Filter…"
                :model-value="String(header.column.getFilterValue() ?? '')"
                @update:model-value="header.column.setFilterValue($event)"
              />
            </template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in vueTable.getRowModel().rows" :key="row.id">
          <td
            v-for="cell in row.getAllCells()"
            :key="cell.id"
            class="border-surface border-b p-2"
          >
            {{ cell.getValue() }}
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination
      v-if="!isEmpty"
      :total="pagination.total ?? 0"
      :page="pagination.page"
      :pages="pageCount"
      :limit="pagination.perPage"
      @next="onPaginate(pagination.page + 1)"
      @prev="onPaginate(pagination.page - 1)"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/ListSurface
 * @description The List archetype surface — `@tanstack/vue-table` in
 * controlled/manual mode bound to `port.table` (design.md FE-2977 §Block D).
 * Sort/filter/paginate interactions emit a `TableIntent` via `channel.emit`;
 * rows and table state are always re-read from `channel.read()`. The
 * composable owns the model — this surface sorts/filters/paginates nothing
 * itself (`manualSorting`/`manualFiltering`/`manualPagination`, and only
 * `getCoreRowModel()` — no `getSortedRowModel`/`getFilteredRowModel`/
 * `getPaginationRowModel`). Holistic filters (FE-1335's schema-driven form)
 * are Task 14 — this is the generic per-column keyword filter only.
 */

import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed } from "vue";
import { Alert, Icon, Input, Pagination } from "@upmind-automation/upmind-ui";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import {
  entries,
  flatMap,
  fromPairs,
  isFunction,
  map,
  startCase,
  uniq
} from "lodash-es";
import type { ListRow, ListSurfaceProps } from "./ListSurface.types";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState
} from "@tanstack/vue-table";
// -----------------------------------------------------------------------------

const props = defineProps<ListSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);

const rows = computed<ListRow[]>(
  () => (props.snapshot.context.data as ListRow[] | undefined) ?? []
);

const isEmpty = computed(() => rows.value.length === 0);

// One `channel.read()` per render, tied to `snapshot` so any composable pull
// (its own re-query after a sort/filter/paginate, or an unrelated refresh)
// is always reflected — the port's "never cache across pulls" contract, one
// layer up (`useCompositionPort.ts`).
const tableModel = computed(() => {
  void props.snapshot;
  return props.table.read();
});

const hasActiveFilters = computed(
  () => Object.keys(tableModel.value.filter).length > 0
);

function deriveColumns(data: ListRow[]): ColumnDef<ListRow>[] {
  const columnKeys = uniq(flatMap(data, row => Object.keys(row)));
  return map(columnKeys, key => ({
    id: key,
    header: startCase(key),
    accessorFn: (row: ListRow) => row[key],
    enableColumnFilter: true
  }));
}

const columns = computed<ColumnDef<ListRow>[]>(() => deriveColumns(rows.value));

const sortingState = computed<SortingState>(() =>
  map(tableModel.value.sort, entry => ({
    id: entry.field,
    desc: entry.dir === "desc"
  }))
);

const columnFiltersState = computed<ColumnFiltersState>(() =>
  map(entries(tableModel.value.filter), ([id, value]) => ({ id, value }))
);

const onSortingChange: OnChangeFn<SortingState> = updaterOrValue => {
  const next = isFunction(updaterOrValue)
    ? updaterOrValue(sortingState.value)
    : updaterOrValue;
  props.table.emit({
    type: "sort",
    sort: map(next, entry => ({
      field: entry.id,
      dir: entry.desc ? "desc" : "asc"
    }))
  });
};

const onColumnFiltersChange: OnChangeFn<
  ColumnFiltersState
> = updaterOrValue => {
  const next = isFunction(updaterOrValue)
    ? updaterOrValue(columnFiltersState.value)
    : updaterOrValue;
  props.table.emit({
    type: "filter",
    model: fromPairs(map(next, entry => [entry.id, entry.value]))
  });
};

// `useVueTable` (v8) has no built-in deep reactivity of its own — every
// option below is a live getter over a computed, `@tanstack/vue-table`'s own
// documented pattern for a fully controlled Vue table (its `mergeProxy`
// re-reads each getter on every access, never a one-off snapshot).
const vueTable = useVueTable({
  get data() {
    return rows.value;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true,
  manualFiltering: true,
  manualPagination: true,
  state: {
    get sorting() {
      return sortingState.value;
    },
    get columnFilters() {
      return columnFiltersState.value;
    }
  },
  onSortingChange,
  onColumnFiltersChange
});

function sortIcon(direction: false | "asc" | "desc"): string {
  if (direction === "asc") return "chevron-up";
  if (direction === "desc") return "chevron-down";
  return "chevron-selector-vertical";
}

const pagination = computed(() => tableModel.value.pagination);

const pageCount = computed(() => {
  const total = pagination.value.total;
  if (total === undefined) return pagination.value.page;
  return Math.max(1, Math.ceil(total / pagination.value.perPage));
});

function onPaginate(page: number): void {
  props.table.emit({
    type: "paginate",
    page,
    perPage: pagination.value.perPage
  });
}
</script>
