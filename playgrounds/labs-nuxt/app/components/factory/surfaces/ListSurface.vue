<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else :class="styles.listSurface.root">
    <ActionSlots
      v-if="meta.hasCollectionActions"
      :class="styles.listSurface.collectionActions"
      :actions="collectionActionItems"
    />

    <Alert
      v-if="meta.isEmpty && meta.hasActiveFilters"
      variant="minimal"
      icon="search-lg"
      title="No matching rows"
      description="No rows match the active filters."
    />
    <Alert
      v-else-if="meta.isEmpty"
      variant="minimal"
      icon="inbox-01"
      title="No data"
      description="This collection is empty."
    />

    <Table v-else-if="meta.hasTable" :class="styles.listSurface.table">
      <TableHeader>
        <TableRow
          v-for="headerGroup in vueTable.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :class="styles.listSurface.headerCell"
          >
            <template v-if="!header.isPlaceholder">
              <button
                v-if="header.column.getCanSort()"
                type="button"
                :class="styles.listSurface.sortButton"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                {{ header.column.columnDef.header }}
                <Icon
                  :icon="sortIcon(header.column.getIsSorted())"
                  size="2xs"
                />
              </button>
              <span v-else>{{ header.column.columnDef.header }}</span>

              <label
                v-if="header.column.getCanFilter()"
                :class="styles.listSurface.filterLabel"
              >
                <span :class="styles.listSurface.filterLabelText">
                  Filter {{ header.column.columnDef.header }}
                </span>
                <Input
                  placeholder="Filter…"
                  :model-value="String(header.column.getFilterValue() ?? '')"
                  @update:model-value="header.column.setFilterValue($event)"
                />
              </label>
            </template>
          </TableHead>
          <TableHead
            v-if="meta.hasRowActions"
            :class="styles.listSurface.headerCell"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in vueTable.getRowModel().rows" :key="row.id">
          <TableCell
            v-for="cell in row.getAllCells()"
            :key="cell.id"
            :class="styles.listSurface.dataCell"
          >
            {{ cell.getValue() }}
          </TableCell>
          <TableCell
            v-if="meta.hasRowActions"
            :class="styles.listSurface.dataCell"
          >
            <ActionSlots :actions="rowActionItems(row.original)" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- Degrade (finding #7): a data-array-without-table descriptor still
         renders every row, read-only — never blank. -->
    <ul v-else :class="styles.listSurface.rowList">
      <li
        v-for="(row, index) in rows"
        :key="rowKey(row, index)"
        :class="styles.listSurface.rowListItem"
      >
        <div :class="styles.listSurface.rowListFields">
          <span
            v-for="entry in rowEntries(row)"
            :key="entry[0]"
            :class="styles.listSurface.rowListField"
          >
            <strong>{{ startCase(entry[0]) }}:</strong> {{ entry[1] }}
          </span>
        </div>
        <ActionSlots
          v-if="rowActionItems(row).length"
          :actions="rowActionItems(row)"
        />
      </li>
    </ul>

    <Pagination
      v-if="!meta.isEmpty && meta.hasTable"
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
 * are Task 14 — this is the generic per-column keyword filter only. A module
 * with no table channel (`hasDataArray` without `hasTable`) degrades to a
 * read-only row list instead of rendering blank. Row/collection actions bind
 * to the well-known `LIST_SURFACE_ACTION` names only when the live port
 * actually exposes them — never a guessed key.
 */

import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed } from "vue";
import {
  Alert,
  Icon,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useStyles
} from "@upmind-automation/upmind-ui";
import ActionSlots from "../ActionSlots.vue";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import config from "./ListSurface.styles";
import { LIST_SURFACE_ACTION } from "./ListSurface.types";
import {
  entries,
  flatMap,
  fromPairs,
  includes,
  isEmpty,
  isFunction,
  isNil,
  keys,
  map,
  reduce,
  some,
  startCase,
  uniq
} from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { ListRow, ListSurfaceProps } from "./ListSurface.types";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState
} from "@tanstack/vue-table";
import type { TableModel } from "@upmind-automation/scenario-harness";
// -----------------------------------------------------------------------------

const props = defineProps<ListSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);

const rows = computed<ListRow[]>(
  () => (props.snapshot.context.data as ListRow[] | undefined) ?? []
);

// One `channel.read()` per render, tied to `snapshot` so any composable pull
// (its own re-query after a sort/filter/paginate, or an unrelated refresh)
// is always reflected — the port's "never cache across pulls" contract, one
// layer up (`useCompositionPort.ts`). Absent a table channel there is no
// model to read — an inert default keeps every downstream read safe.
const tableModel = computed<TableModel>(() => {
  void props.snapshot;
  return (
    props.table?.read() ?? {
      filter: {},
      sort: [],
      pagination: { page: 1, perPage: rows.value.length || 1 }
    }
  );
});

function deriveColumns(data: ListRow[]): ColumnDef<ListRow>[] {
  const columnKeys = uniq(flatMap(data, row => keys(row)));
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
  props.table?.emit({
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
  props.table?.emit({
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
  if (isNil(total)) return pagination.value.page;
  return Math.max(1, Math.ceil(total / pagination.value.perPage));
});

function onPaginate(page: number): void {
  props.table?.emit({
    type: "paginate",
    page,
    perPage: pagination.value.perPage
  });
}

// --- actions (finding #5) — bound to the live CompositionPort action map,
// gated on `snapshot.actions` (the booted cell's own live-name list, the
// same gate ActionPanelSurface trusts) so a module missing a capability
// simply never surfaces that control.
const ROW_ACTION_KEYS = [
  LIST_SURFACE_ACTION.DELETE,
  LIST_SURFACE_ACTION.SET_DEFAULT,
  LIST_SURFACE_ACTION.RESEND
] as const;

function isActionAvailable(name: string): boolean {
  return (
    includes(props.snapshot.actions, name) && isFunction(props.actions[name])
  );
}

function rowActionItems(row: ListRow): ActionSlotItem[] {
  return reduce(
    ROW_ACTION_KEYS,
    (acc: ActionSlotItem[], key) => {
      if (isActionAvailable(key))
        acc.push({
          name: key,
          label: startCase(key),
          onSelect: () => props.actions[key](row.id)
        });
      return acc;
    },
    [] as ActionSlotItem[]
  );
}

const collectionActionItems = computed<ActionSlotItem[]>(() => {
  if (!isActionAvailable(LIST_SURFACE_ACTION.ADD)) return [];
  return [
    {
      name: LIST_SURFACE_ACTION.ADD,
      label: startCase(LIST_SURFACE_ACTION.ADD),
      onSelect: () => props.actions[LIST_SURFACE_ACTION.ADD]()
    }
  ];
});

// --- degrade-mode (finding #7) row rendering
function rowEntries(row: ListRow): Array<[string, unknown]> {
  return entries(row);
}

function rowKey(row: ListRow, index: number): string {
  return isNil(row.id) ? String(index) : String(row.id);
}

// The component's ONE flag surface (W-29) — every is/has/can flag the template
// reads, and the same object `useStyles` resolves its CVA variants from.
const meta = computed(() => ({
  state: state.value,
  isEmpty: isEmpty(rows.value),
  hasTable: !!props.table,
  hasActiveFilters: !isEmpty(tableModel.value.filter),
  hasRowActions: some(ROW_ACTION_KEYS, isActionAvailable),
  hasCollectionActions: !isEmpty(collectionActionItems.value)
}));

const styles = useStyles(["listSurface"], meta, config);
</script>
