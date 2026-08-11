<template>
  <ModuleStateNotice v-if="notice" :state="notice" :detail="detail" />
  <div v-else :class="styles.listSurface.root">
    <!-- A rejected criteria write leaves the list VALID and showing its last
         good rows, so its verdict belongs beside the table, never in place of
         it: swapping the surface out would unmount the very controls that
         issue the next valid write. -->
    <ModuleStateNotice
      v-if="verdict"
      :state="ModuleState.ERROR"
      :detail="verdict"
    />

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
            </template>
          </TableHead>
          <TableHead
            v-if="meta.hasRowActions"
            :class="styles.listSurface.headerCell"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="row in vueTable.getRowModel().rows"
          :key="row.id"
          :class="dataRow({ isMarked: isMarked(row.original) })"
        >
          <TableCell
            v-for="(element, index) in columnElements"
            :key="element.scope"
            :class="styles.listSurface.dataCell"
          >
            <!-- The marker rides the FIRST declared column, so the default row
                 reads as the default without spending a column on it (C12). -->
            <Icon
              v-if="!index && marker && isMarked(row.original)"
              :icon="marker.icon"
              size="xs"
            />
            <template v-if="element.options.cell === RowCellTypes.BADGES">
              <Badge
                v-for="badge in visibleBadges(element, row.original)"
                :key="badge.flag"
                size="sm"
                variant="minimal"
                :color="badge.color"
                :icon="badge.icon"
                :label="t(badge.i18n)"
              />
            </template>
            <template v-else>{{ cellText(element, row.original) }}</template>
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

    <!-- A data-array-without-table descriptor still renders every row,
         read-only — never blank. -->
    <ul v-else :class="styles.listSurface.rowList">
      <li
        v-for="(row, index) in rows"
        :key="isNil(row.id) ? String(index) : String(row.id)"
        :class="styles.listSurface.rowListItem"
      >
        <div :class="styles.listSurface.rowListFields">
          <span
            v-for="entry in entries(row)"
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
 * @module scenarios/runtime/components/surfaces/ListSurface
 * @description The List archetype surface — `@tanstack/vue-table` in
 * controlled/manual mode bound to `port.table`.
 * Sort/filter/paginate interactions emit a `TableIntent` via `channel.emit`;
 * rows and table state are always re-read from `channel.read()`. The
 * composable owns the model — this surface sorts/paginates nothing
 * itself (`manualSorting`/`manualPagination`, and only
 * `getCoreRowModel()` — no `getSortedRowModel`/`getPaginationRowModel`).
 * Filtering has exactly ONE surface: `FilterBar` (FE-1335's schema-driven
 * bar) over the composable-owned criteria. A module
 * with no table channel (`hasDataArray` without `hasTable`) degrades to a
 * read-only row list instead of rendering blank.
 *
 * EVERY column, cell treatment, label and action is the SCENARIO's own
 * declaration (`presentation`), never inferred: the surface has no vocabulary
 * of any module's fields or action names, so a column exists because it was
 * declared and an action is offered because the row's own meta permits it
 * (C5 · C10 · C11 · C12 · C15).
 */

import { toDataPath } from "@jsonforms/core";
import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { SortDirection } from "@upmind-automation/headless";
import {
  Badge,
  Icon,
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
import { TableIntentTypes } from "../../composables/useTableChannel";
import { RowCellTypes } from "../../scenario.types";
import {
  isRuleEnabled,
  isRuleVisible,
  resolveScope
} from "../../scenario.utils";
import ActionSlots from "../ActionSlots.vue";
import { resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { useActionFeedback } from "../useActionFeedback";
import config, { dataRow } from "./ListSurface.styles";
import {
  entries,
  filter,
  get,
  includes,
  isEmpty,
  isFunction,
  isNil,
  map,
  snakeCase,
  startCase,
  toString
} from "lodash-es";
import type {
  RowBadge,
  RowElement,
  ScenarioAction
} from "../../scenario.types";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { ListRow, ListSurfaceProps } from "./ListSurface.types";
import type {
  ColumnDef,
  OnChangeFn,
  SortDirection as TableSortDirection,
  SortingState
} from "@tanstack/vue-table";
import type { TableModel } from "@upmind-automation/scenario-harness";
// -----------------------------------------------------------------------------

const props = defineProps<ListSurfaceProps>();

const { t } = useI18n();

// The read-only degradation path keeps its humanised key: it renders a row the
// scenario declared nothing about, so there is no label to resolve.
function fieldLabel(key: string): string {
  const vocabularyKey = `text.${snakeCase(key)}`;
  const label = t(vocabularyKey);
  return label === vocabularyKey ? startCase(key) : label;
}

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);

const feedback = useActionFeedback();

// The notice stands in for the list only BEFORE the module first presents it. A
// row action that the API refuses lands in the very same `hasError` channel a
// failed load does, and the module keeps it indefinitely — so reading that
// channel afterwards would take the table, its controls and the user's place in
// the list away over one refused row, with nothing left to recover with.
const hasPresented = ref(false);
watchEffect(() => {
  if (state.value === ModuleState.READY) hasPresented.value = true;
});

const notice = computed(() =>
  hasPresented.value || state.value === ModuleState.READY
    ? undefined
    : state.value
);

// A failure this surface already reported as a toast is not drawn a second time
// as the list's verdict — the module holds it as state, so re-reading it would
// brand the list with one refusal for the rest of the session.
const verdict = computed(() =>
  feedback.isReported(detail.value) ? undefined : detail.value
);

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

// What the module's query schema declares steerable. A control the schema never
// declared cannot work — the intent reaches the criteria, ajv refuses it, and
// the list draws a failure for a header the user was invited to click — so it
// is not offered at all. A channel that declares nothing leaves every column
// live, which is where a module with no query schema already stands.
const declared = computed(() => props.table?.declared?.());

/** The declared columns, in declaration order. Undeclared row keys never render. */
const columnElements = computed<RowElement[]>(
  () => props.presentation?.row.elements ?? []
);

/** The declared default-row treatment (C12), if this scenario names one. */
const marker = computed(() => props.presentation?.row.options?.marker);

function isMarked(row: ListRow): boolean {
  return !!marker.value && !!resolveScope(row, marker.value.scope);
}

const columns = computed<ColumnDef<ListRow>[]>(() =>
  map(columnElements.value, element => {
    const field = toDataPath(element.scope);
    return {
      id: field,
      header: t(element.i18n),
      accessorFn: (row: ListRow) => resolveScope(row, element.scope),
      // A column the query schema never declared sortable cannot work — the
      // intent reaches the criteria, ajv refuses it, and the list draws a
      // failure for a header the user was invited to click.
      enableSorting: includes(declared.value?.sort, field)
    };
  })
);

/** The badges a {@link RowCellTypes.BADGES} cell shows for this row — truthy flags only. */
function visibleBadges(element: RowElement, row: ListRow): RowBadge[] {
  const value = resolveScope(row, element.scope) as Record<string, unknown>;
  return filter(
    element.options.badges ?? [],
    badge => !!get(value, badge.flag)
  );
}

/** What a non-badge cell reads. A `useDate` descriptor speaks its relative form. */
function cellText(element: RowElement, row: ListRow): string {
  const value = resolveScope(row, element.scope);
  if (isNil(value)) return "";

  return element.options.cell === RowCellTypes.DATE
    ? toString(get(value, "relative"))
    : toString(value);
}

const sortingState = computed<SortingState>(() =>
  map(tableModel.value.sort, entry => ({
    id: entry.field,
    desc: entry.dir === SortDirection.DESC
  }))
);

const onSortingChange: OnChangeFn<SortingState> = updaterOrValue => {
  const next = isFunction(updaterOrValue)
    ? updaterOrValue(sortingState.value)
    : updaterOrValue;
  props.table?.emit({
    type: TableIntentTypes.SORT,
    sort: map(next, entry => ({
      field: entry.id,
      dir: entry.desc ? SortDirection.DESC : SortDirection.ASC
    }))
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
  manualPagination: true,
  state: {
    get sorting() {
      return sortingState.value;
    }
  },
  onSortingChange
});

function sortIcon(direction: false | TableSortDirection): string {
  if (direction === SortDirection.ASC) return "chevron-up";
  if (direction === SortDirection.DESC) return "chevron-down";
  return "chevron-selector-vertical";
}

const pagination = computed(() => tableModel.value.pagination);

const pageCount = computed(() => {
  const total = pagination.value.total;
  if (isNil(total)) return pagination.value.page;
  // An unpaged window is ONE page, not Infinity: `limit: 0` is legal against
  // the schema's deliberate `minimum: 0`, so it reaches here as `perPage: 0`.
  // Same guard `useQuery`'s own `pageTotal` applies.
  if (!pagination.value.perPage) return 1;
  return Math.max(1, Math.ceil(total / pagination.value.perPage));
});

function onPaginate(page: number): void {
  props.table?.emit({
    type: TableIntentTypes.PAGINATE,
    page,
    perPage: pagination.value.perPage
  });
}

// --- actions — every one DECLARED by the scenario, then gated on
// `snapshot.actions` (the booted cell's own live-name list, the same gate
// ActionPanelSurface trusts) so a declaration naming a capability the live port
// does not expose simply never surfaces that control.
const rowActions = computed<ScenarioAction[]>(
  () => props.presentation?.rowActions ?? []
);

function isActionAvailable(name: string): boolean {
  return (
    includes(props.snapshot.actions, name) && isFunction(props.actions[name])
  );
}

/** Every declared action the live port exposes AND this row's own rule permits. */
function availableActions(row: ListRow): ScenarioAction[] {
  return filter(
    rowActions.value,
    action => isActionAvailable(action.name) && isRuleVisible(action, row)
  );
}

function rowActionItems(row: ListRow): ActionSlotItem[] {
  return map(availableActions(row), action => {
    const control = `${action.name}:${row.id}`;
    return {
      name: action.name,
      label: t(action.i18n),
      icon: action.icon,
      color: action.color,
      variant: action.variant,
      placement: action.placement,
      // The precondition is the ROW's own — a rule over the meta the record
      // itself carries, never a client-side guess about what the API allows.
      disabled: !isRuleEnabled(action, row) || feedback.isPending(control),
      onSelect: () =>
        feedback.fire(control, () => props.actions[action.name](row.id), {
          success: t(get(action, ["feedback", "success"], "")),
          failure: t(get(action, ["feedback", "failure"], ""))
        })
    };
  });
}

const collectionActionItems = computed<ActionSlotItem[]>(() =>
  map(
    filter(props.presentation?.collectionActions ?? [], action =>
      isActionAvailable(action.name)
    ),
    action => ({
      name: action.name,
      label: t(action.i18n),
      icon: action.icon,
      color: action.color,
      variant: action.variant,
      placement: action.placement,
      onSelect: () => props.actions[action.name]()
    })
  )
);

// The component's ONE flag surface — every is/has/can flag the template reads,
// and the same object `useStyles` resolves its CVA variants from.
const meta = computed(() => ({
  state: state.value,
  isEmpty: isEmpty(rows.value),
  // A table needs BOTH the controlled channel and a declared column set: with
  // key-sniffing gone, a scenario that declares no row has no table to draw and
  // degrades to the read-only list rather than rendering empty headers.
  hasTable: !!props.table && !isEmpty(columnElements.value),
  // The module's own answer (`useMeta().isFiltered`), never a renderer-side
  // guess off the flattened filter model: *empty because nothing exists* and
  // *empty because your filters match nothing* are different states.
  isFiltered: !!props.snapshot.meta.isFiltered,
  hasRowActions: !isEmpty(
    filter(rowActions.value, action => isActionAvailable(action.name))
  ),
  hasCollectionActions: !isEmpty(collectionActionItems.value)
}));

const styles = useStyles(["listSurface"], meta, config);
</script>
