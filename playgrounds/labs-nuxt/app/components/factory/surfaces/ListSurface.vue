<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else :class="styles.listSurface.root">
    <ActionSlots
      v-if="meta.hasCollectionActions"
      :class="styles.listSurface.collectionActions"
      :actions="collectionActionItems"
    />

    <Interstitial
      v-if="meta.isEmpty && meta.isFiltered"
      :title="t('text.results_not_found')"
      :text="t('text.adjust_search_filters_msg')"
    >
      <template #avatar><Icon icon="search-lg" size="xl" /></template>
    </Interstitial>
    <Interstitial
      v-else-if="meta.isEmpty"
      :title="t('text.collection_empty')"
      :text="t('text.collection_empty_msg')"
    >
      <template #avatar><Icon icon="inbox-01" size="xl" /></template>
    </Interstitial>

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
                  {{
                    t("text.filter_by", { field: fieldLabel(header.column.id) })
                  }}
                </span>
                <Input
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
            <strong>{{ fieldLabel(entry[0]) }}:</strong> {{ entry[1] }}
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
      :pagination-info="
        t('text.pagination_info', { page: '{page}', pages: '{pages}' })
      "
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
 * `getPaginationRowModel`). This is the generic per-column keyword filter only:
 * the holistic filter form (FE-1335's schema-driven bar) is `FilterBar`, mounted
 * by the page over the same composable-owned criteria (W-D33). A module
 * with no table channel (`hasDataArray` without `hasTable`) degrades to a
 * read-only row list instead of rendering blank. Row/collection actions bind
 * to the well-known `LIST_SURFACE_ACTION` names only when the live port
 * actually exposes them — never a guessed key.
 */

import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Icon,
  Input,
  Interstitial,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useStyles
} from "@upmind-automation/upmind-ui";
import { TableIntentTypes } from "../../../composables/factory/useTableChannel";
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
  snakeCase,
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

const { t } = useI18n();

// A List column is whatever key the module's own data carries, so no static
// vocabulary can enumerate them: the shared `text.*` entry wins where one
// exists and the raw key is humanised only where none does.
function fieldLabel(key: string): string {
  const vocabularyKey = `text.${snakeCase(key)}`;
  const label = t(vocabularyKey);
  return label === vocabularyKey ? startCase(key) : label;
}

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
    header: fieldLabel(key),
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
    type: TableIntentTypes.SORT,
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
    type: TableIntentTypes.FILTER,
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
    type: TableIntentTypes.PAGINATE,
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

/** Every action's label resolves through the shared action vocabulary, never through its own name humanised. */
const ACTION_LABEL_KEY = {
  [LIST_SURFACE_ACTION.DELETE]: "action.remove",
  [LIST_SURFACE_ACTION.SET_DEFAULT]: "action.set_as_default",
  [LIST_SURFACE_ACTION.RESEND]: "action.verify",
  [LIST_SURFACE_ACTION.ADD]: "action.add_new"
} as const;

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
          label: t(ACTION_LABEL_KEY[key]),
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
      label: t(ACTION_LABEL_KEY[LIST_SURFACE_ACTION.ADD]),
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
  // The module's own answer (`useMeta().isFiltered`), never a renderer-side
  // guess off the flattened filter model: *empty because nothing exists* and
  // *empty because your filters match nothing* are different states.
  isFiltered: !!props.snapshot.meta.isFiltered,
  hasRowActions: some(ROW_ACTION_KEYS, isActionAvailable),
  hasCollectionActions: !isEmpty(collectionActionItems.value)
}));

const styles = useStyles(["listSurface"], meta, config);
</script>
