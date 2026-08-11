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

    <!-- ONE toolbar row: what steers the list and what acts on it sit together
         and wrap, never on stacked lines of their own. -->
    <div v-if="meta.hasToolbar" :class="styles.listSurface.toolbar">
      <FilterBar
        v-if="criteria"
        :criteria="criteria"
        :class="styles.listSurface.toolbarFilters"
      />
      <div :class="styles.listSurface.toolbarControls">
        <!-- The same rows, from the scenario's second declaration. Which view is
             on is the RENDERER's own ephemeral state (AC2) — no refetch, no
             declaration, no url. -->
        <ToggleGroup
          v-if="meta.hasCardView"
          type="single"
          size="sm"
          :model-value="view"
          :items="viewItems"
          @update:model-value="onView"
        />
        <ActionSlots
          v-if="meta.hasCollectionActions"
          :actions="collectionActionItems"
        />
      </div>
    </div>

    <template v-if="meta.isCardView">
      <div
        v-if="meta.isLoading || !meta.isEmpty"
        :class="styles.listSurface.cardGrid"
      >
        <!-- The placeholder is the CARD's own shape, field for field, so the
             layout that lands is the layout the user was waiting for (C8). -->
        <template v-if="meta.isLoading">
          <Card
            v-for="placeholder in SKELETON_ROWS"
            :key="placeholder"
            :class="dataCard()"
          >
            <Skeleton
              v-for="element in cardElements"
              :key="element.scope"
              :class="styles.listSurface.skeletonCard"
            />
          </Card>
        </template>
        <template v-else>
          <Card
            v-for="(row, index) in rows"
            :key="rowKey(row, index)"
            :class="dataCard({ isMarked: isMarked(row) })"
          >
            <header :class="styles.listSurface.cardHeader">
              <div :class="styles.listSurface.cardLead">
                <Icon
                  v-if="marker"
                  :icon="marker.icon"
                  :variant="isMarked(row) ? marker.marked : marker.unmarked"
                  size="nano"
                  :class="rowMarker({ isMarked: isMarked(row) })"
                />
                <h3 :class="styles.listSurface.cardTitle">
                  <RowCell
                    v-for="element in cardSlot(CardSlotTypes.TITLE)"
                    :key="element.scope"
                    :element="element"
                    :row="row"
                  />
                </h3>
              </div>
              <ActionSlots
                v-if="rowActionItems(row).length"
                icon-only
                :actions="rowActionItems(row)"
              />
            </header>

            <p
              v-for="element in cardSlot(CardSlotTypes.SUBTITLE)"
              :key="element.scope"
              :class="styles.listSurface.cardSubtitle"
            >
              <RowCell :element="element" :row="row" />
            </p>

            <div
              v-if="cardSlot(CardSlotTypes.BODY).length"
              :class="styles.listSurface.cardBody"
            >
              <RowCell
                v-for="element in cardSlot(CardSlotTypes.BODY)"
                :key="element.scope"
                :element="element"
                :row="row"
              />
            </div>
          </Card>
        </template>
      </div>
      <ListEmpty v-else :is-filtered="meta.isFiltered" />
    </template>

    <!-- The table is the FRAME: its headers stay through every state, and each
         state is drawn inside its body rather than in place of it (C8/C9). -->
    <Table v-else-if="meta.hasTable">
      <TableHeader>
        <TableRow
          v-for="headerGroup in vueTable.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <!-- The marker column is deliberately header-less: it labels nothing,
               it IS the row's own flag. -->
          <TableHead
            v-if="meta.hasMarker"
            :class="styles.listSurface.markerCell"
          />
          <!-- The whole header cell is the hit area, so the handler sits on it
               rather than on the button inside; the button's own click (mouse
               OR keyboard) bubbles here, and TanStack's handler no-ops on a
               column that declared no sort field, so neither fires twice. -->
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :class="headerCell({ isSortable: header.column.getCanSort() })"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <template v-if="!header.isPlaceholder">
              <Button
                v-if="header.column.getCanSort()"
                size="sm"
                variant="ghost"
                color="neutral"
                :class="styles.listSurface.sortControl"
                :label="toString(header.column.columnDef.header)"
                :icon-append="sortIcon(header.column.getIsSorted())"
              />
              <span v-else>{{ header.column.columnDef.header }}</span>
            </template>
          </TableHead>
          <TableHead
            v-if="meta.hasRowActions"
            :class="styles.listSurface.actionsCell"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="meta.isLoading">
          <TableRow v-for="placeholder in SKELETON_ROWS" :key="placeholder">
            <TableCell
              v-if="meta.hasMarker"
              :class="styles.listSurface.markerCell"
            >
              <Skeleton :class="styles.listSurface.skeletonMarker" />
            </TableCell>
            <TableCell v-for="element in columnElements" :key="element.scope">
              <Skeleton :class="styles.listSurface.skeletonCell" />
            </TableCell>
            <TableCell
              v-if="meta.hasRowActions"
              :class="styles.listSurface.actionsCell"
            >
              <Skeleton :class="styles.listSurface.skeletonActions" />
            </TableCell>
          </TableRow>
        </template>

        <TableEmpty v-else-if="meta.isEmpty" :colspan="columnCount">
          <ListEmpty :is-filtered="meta.isFiltered" />
        </TableEmpty>

        <template v-else>
          <TableRow
            v-for="row in vueTable.getRowModel().rows"
            :key="row.id"
            :class="dataRow({ isMarked: isMarked(row.original) })"
          >
            <!-- The marker is its OWN column, ahead of every declared one, so
                 the default row reads as the default without the flag riding
                 (and crowding) a cell that means something else (C12). -->
            <TableCell v-if="marker" :class="styles.listSurface.markerCell">
              <Icon
                :icon="marker.icon"
                :variant="
                  isMarked(row.original) ? marker.marked : marker.unmarked
                "
                size="nano"
                :class="rowMarker({ isMarked: isMarked(row.original) })"
              />
            </TableCell>
            <TableCell v-for="element in columnElements" :key="element.scope">
              <div :class="styles.listSurface.cellContent">
                <RowCell :element="element" :row="row.original" />
              </div>
            </TableCell>
            <TableCell
              v-if="meta.hasRowActions"
              :class="styles.listSurface.actionsCell"
            >
              <ActionSlots icon-only :actions="rowActionItems(row.original)" />
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <ListEmpty v-else-if="meta.isEmpty" :is-filtered="meta.isFiltered" />

    <!-- A data-array-without-table descriptor still renders every row,
         read-only — never blank. The DECLARATION drives it exactly as it drives
         the table, so the same columns are shown, under the same labels, and a
         property nobody declared is as absent here as it is there (C15). -->
    <ul v-else :class="styles.listSurface.rowList">
      <li
        v-for="(row, index) in rows"
        :key="rowKey(row, index)"
        :class="styles.listSurface.rowListItem"
      >
        <div :class="styles.listSurface.rowListFields">
          <span
            v-for="element in columnElements"
            :key="element.scope"
            :class="styles.listSurface.rowListField"
          >
            <strong>{{ t(element.i18n) }}</strong>
            <RowCell :element="element" :row="row" />
          </span>
        </div>
        <ActionSlots
          v-if="rowActionItems(row).length"
          icon-only
          :actions="rowActionItems(row)"
        />
      </li>
    </ul>

    <Pagination
      v-if="meta.hasTable && !meta.isEmpty && !meta.isLoading"
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

    <ManageDialog
      v-if="manage"
      :key="manageKey"
      :handoff="manage.handoff"
      :context-id="manage.contextId"
      @close="manage = undefined"
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
 * bar) over the composable-owned criteria, drawn in the SAME toolbar row as the
 * view toggle and the collection's own actions. A module
 * with no table channel (`hasDataArray` without `hasTable`) degrades to a
 * read-only row list instead of rendering blank.
 *
 * EVERY column, cell treatment, label and action is the SCENARIO's own
 * declaration (`presentation`), never inferred: the surface has no vocabulary
 * of any module's fields or action names, so a column exists because it was
 * declared and an action is offered because the row's own meta permits it
 * (C5 · C10 · C11 · C12 · C15). The same rows draw as CARDS from the scenario's
 * second declaration, and creating or editing one is a declared HANDOFF to the
 * editor scenario that owns that form (C1 · C2 · C13).
 *
 * The table is also the FRAME (C8/C9): loading and empty are drawn inside it,
 * under the real headers, so nothing the user is waiting for moves when the
 * rows land.
 */

import { toDataPath } from "@jsonforms/core";
import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { SortDirection } from "@upmind-automation/headless";
import {
  Button,
  Card,
  Icon,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  useStyles
} from "@upmind-automation/upmind-ui";
import { TableIntentTypes } from "../../composables/useTableChannel";
import { CardSlotTypes } from "../../scenario.types";
import {
  isRuleEnabled,
  isRuleVisible,
  resolvePointer,
  resolveScope
} from "../../scenario.utils";
import ActionSlots from "../ActionSlots.vue";
import FilterBar from "../FilterBar.vue";
import ManageDialog from "../ManageDialog.vue";
import { resolveModuleDetail, resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { useActionFeedback } from "../useActionFeedback";
import ListEmpty from "./ListEmpty.vue";
import config, {
  dataCard,
  dataRow,
  headerCell,
  rowMarker
} from "./ListSurface.styles";
import { ListViewTypes } from "./ListSurface.types";
import RowCell from "./RowCell.vue";
import {
  filter,
  get,
  includes,
  isEmpty,
  isFunction,
  isNil,
  map,
  toString
} from "lodash-es";
import type { RowElement, ScenarioAction } from "../../scenario.types";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { ManageDialogProps } from "../ManageDialog.types";
import type { ListRow, ListSurfaceProps } from "./ListSurface.types";
import type {
  ColumnDef,
  OnChangeFn,
  SortDirection as TableSortDirection,
  SortingState
} from "@tanstack/vue-table";
import type { TableModel } from "@upmind-automation/scenario-harness";
import type { ToggleGroupItem } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<ListSurfaceProps>();

const { t } = useI18n();

/** How many placeholders stand in for the rows that have not landed yet. */
const SKELETON_ROWS = 5;

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => resolveModuleDetail(props.snapshot.context));

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

const notice = computed(() => {
  if (state.value === ModuleState.READY || hasPresented.value) return undefined;
  // A declared frame draws its OWN loading: the headers stay and skeleton rows
  // stand in for the data, so the layout never jumps when it arrives (C8).
  if (state.value === ModuleState.LOADING && hasTable.value) return undefined;
  return state.value;
});

// A failure this surface already reported as a toast is not drawn a second time
// as the list's verdict — the module holds it as state, so re-reading it would
// brand the list with one refusal for the rest of the session.
const verdict = computed(() =>
  feedback.isReported(detail.value) ? undefined : detail.value
);

const rows = computed<ListRow[]>(
  () => (props.snapshot.context.data as ListRow[] | undefined) ?? []
);

/** A row's own identity, with its position as the fallback for a row without one. */
function rowKey(row: ListRow, index: number): string {
  const id = get(row, "id");
  return isNil(id) ? toString(index) : toString(id);
}

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
  () => props.presentation?.row?.elements ?? []
);

/** The same row's declared CARD fields — the scenario's second declaration. */
const cardElements = computed<RowElement[]>(
  () => props.presentation?.card?.elements ?? []
);

function cardSlot(slot: CardSlotTypes): RowElement[] {
  return filter(cardElements.value, element => element.options.slot === slot);
}

/** The declared default-row treatment (C12), if this scenario names one. */
const marker = computed(
  () => props.presentation?.row?.options?.marker ?? undefined
);

function isMarked(row: ListRow): boolean {
  return !!marker.value && !!resolveScope(row, marker.value.scope);
}

// A table needs BOTH the controlled channel and a declared column set: with
// key-sniffing gone, a scenario that declares no row has no table to draw and
// degrades to the read-only list rather than rendering empty headers.
const hasTable = computed(
  () => !!props.table && !isEmpty(columnElements.value)
);

const hasCardView = computed(
  () => hasTable.value && !isEmpty(cardElements.value)
);

const view = ref<ListViewTypes>(ListViewTypes.TABLE);

const viewItems = computed<ToggleGroupItem[]>(() => [
  { value: ListViewTypes.TABLE, label: t("text.table_view"), icon: "table" },
  { value: ListViewTypes.CARD, label: t("text.card_view"), icon: "grid-01" }
]);

// Un-clicking the active segment leaves the view where it is: a list is always
// drawn as something.
function onView(next: unknown): void {
  if (next === ListViewTypes.TABLE || next === ListViewTypes.CARD)
    view.value = next;
}

/**
 * The wire field a column sorts by — the DECLARATION's own `sortable`, withheld
 * where the query schema does not offer it. A control the schema never declared
 * cannot work: the intent reaches the criteria, ajv refuses it, and the list
 * draws a failure for a header the user was invited to click. A channel that
 * declares nothing leaves every declared column live, which is where a module
 * with no query schema already stands.
 */
function sortField(element: RowElement): string | undefined {
  const field = element.options.sortable;
  const offered = declared.value?.sort;
  return field && (!offered || includes(offered, field)) ? field : undefined;
}

const columns = computed<ColumnDef<ListRow>[]>(() =>
  map(columnElements.value, element => {
    const field = sortField(element);
    return {
      // The column's id IS the wire sort field wherever one is declared, so the
      // model's sort entry, the header's own indicator and the emitted intent
      // all name the same thing with nothing to translate between them.
      id: field ?? toDataPath(element.scope),
      header: t(element.i18n),
      accessorFn: (row: ListRow) => resolveScope(row, element.scope),
      enableSorting: !!field
    };
  })
);

/** The empty state spans every column the frame draws, marker and actions included. */
const columnCount = computed(
  () =>
    columnElements.value.length +
    (marker.value ? 1 : 0) +
    (meta.value.hasRowActions ? 1 : 0)
);

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

// --- the editor a declared handoff opens, over the list it was opened from
const manage = ref<ManageDialogProps | undefined>(undefined);

/** One editor instance per target AND record — never one carried across rows. */
const manageKey = computed(
  () =>
    `${manage.value?.handoff.scenario.key}:${manage.value?.contextId ?? "new"}`
);

function openHandoff(action: ScenarioAction, row?: ListRow): void {
  const handoff = get(props.handoffs, action.handoff as string);
  if (!handoff) return;

  const target =
    handoff.contextFrom && row
      ? resolvePointer(row, handoff.contextFrom)
      : undefined;

  manage.value = {
    handoff,
    contextId: isNil(target) ? undefined : toString(target)
  };
}

// --- actions — every one DECLARED by the scenario, then gated on
// `snapshot.actions` (the booted cell's own live-name list, the same gate
// ActionPanelSurface trusts) so a declaration naming a capability the live port
// does not expose simply never surfaces that control.
const rowActions = computed<ScenarioAction[]>(
  () => props.presentation?.rowActions ?? []
);

function isActionAvailable(action: ScenarioAction): boolean {
  // A handoff control calls no action: what it needs is the target it opens,
  // and without one it would be a button that does nothing (C2).
  if (action.handoff) return !!get(props.handoffs, action.handoff);

  return (
    includes(props.snapshot.actions, action.name) &&
    isFunction(props.actions[action.name])
  );
}

/** Every declared action the live port exposes AND this row's own rule permits. */
function availableActions(row: ListRow): ScenarioAction[] {
  return filter(
    rowActions.value,
    action => isActionAvailable(action) && isRuleVisible(action, row)
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
        action.handoff
          ? openHandoff(action, row)
          : feedback.fire(control, () => props.actions[action.name](row.id), {
              success: t(get(action, ["feedback", "success"], "")),
              failure: t(get(action, ["feedback", "failure"], ""))
            })
    };
  });
}

const collectionActionItems = computed<ActionSlotItem[]>(() =>
  map(
    filter(props.presentation?.collectionActions ?? [], isActionAvailable),
    action => ({
      name: action.name,
      label: t(action.i18n),
      icon: action.icon,
      color: action.color,
      variant: action.variant,
      placement: action.placement,
      onSelect: () =>
        action.handoff ? openHandoff(action) : props.actions[action.name]()
    })
  )
);

// The component's ONE flag surface — every is/has/can flag the template reads,
// and the same object `useStyles` resolves its CVA variants from.
const meta = computed(() => ({
  state: state.value,
  isLoading: state.value === ModuleState.LOADING,
  isEmpty: isEmpty(rows.value),
  hasTable: hasTable.value,
  // The card is a SECOND declaration over the same rows, so the toggle exists
  // only where the scenario wrote one.
  hasCardView: hasCardView.value,
  isCardView: hasCardView.value && view.value === ListViewTypes.CARD,
  // The module's own answer (`useMeta().isFiltered`), never a renderer-side
  // guess off the flattened filter model: *empty because nothing exists* and
  // *empty because your filters match nothing* are different states.
  isFiltered: !!props.snapshot.meta.isFiltered,
  hasMarker: !!marker.value,
  hasRowActions: !isEmpty(filter(rowActions.value, isActionAvailable)),
  hasCollectionActions: !isEmpty(collectionActionItems.value),
  hasToolbar:
    !!props.criteria ||
    hasCardView.value ||
    !isEmpty(collectionActionItems.value)
}));

const styles = useStyles(["listSurface"], meta, config);
</script>
