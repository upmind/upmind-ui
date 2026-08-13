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

    <!-- The two rows the list is steered from: the facets, then what the
         collection amounts to — its count, the chips naming what narrowed it
         and Clear all (R6-16) — beside how it is drawn. The collection's own
         action is NOT among them: it belongs to the page, above this surface
         (G4). -->
    <div v-if="meta.hasControls" :class="styles.listSurface.controls">
      <FilterBar v-if="criteria" :criteria="criteria" :disabled="locked" />
      <!-- Ordering, the column set and the view choice sit with the data they
           change, in BOTH views — the same criteria, written through the same
           emit as a column header, never a second source of truth (G3/E9). -->
      <DisplayRow
        :count="rows.length"
        :total="reportedTotal"
        :criteria="criteria"
        :fields="sortFields"
        :sort="tableModel.sort"
        :columns="pickerColumns"
        :view="view"
        :has-card-view="meta.hasCardView"
        :locked="locked"
        @update:sort="emitSort"
        @update:columns="onColumns"
        @update:view="onView"
      />
    </div>

    <template v-if="meta.isCardView">
      <div
        v-if="meta.isLoading || !meta.isEmpty"
        v-auto-animate
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
            :aria-invalid="rowFailure(row) ? 'true' : undefined"
            :class="
              dataCard({
                isMarked: isMarked(row),
                isFailed: !!rowFailure(row),
                isSucceeded: isSucceeded(row)
              })
            "
          >
            <header :class="styles.listSurface.cardHeader">
              <div :class="styles.listSurface.cardLead">
                <h3 :class="styles.listSurface.cardTitle">
                  <CellDispatcher
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
                :locked="locked"
              />
            </header>

            <p
              v-for="element in cardSlot(CardSlotTypes.SUBTITLE)"
              :key="element.scope"
              :class="styles.listSurface.cardSubtitle"
            >
              <CellDispatcher :element="element" :row="row" />
            </p>

            <div
              v-if="cardSlot(CardSlotTypes.BODY).length"
              :class="styles.listSurface.cardBody"
            >
              <CellDispatcher
                v-for="element in cardSlot(CardSlotTypes.BODY)"
                :key="element.scope"
                :element="element"
                :row="row"
              />
            </div>

            <!-- The same verdict the table draws under its row, drawn inside
                 the card the action was fired from (E12). -->
            <RowFailure
              v-if="rowFailure(row)"
              :message="rowFailure(row) || ''"
              @dismiss="dismissRow(row)"
            />
          </Card>
        </template>
      </div>
      <ListEmpty
        v-else-if="meta.hasEmptyState"
        :is-filtered="meta.isFiltered"
      />
    </template>

    <!-- The table is the FRAME: its headers stay through every state, and each
         state is drawn inside its body rather than in place of it (C8/C9). -->
    <Table v-else-if="meta.hasTable" :class="styles.listSurface.table">
      <TableHeader>
        <TableRow
          v-for="headerGroup in vueTable.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <!-- The whole header cell is the hit area, so the handler sits on it
               rather than on the button inside; the button's own click (mouse
               OR keyboard) bubbles here, and the handler returns on a column
               that declared no sort field, so neither fires twice. -->
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :class="
              headerCell({ isContent: includes(contentColumns, header.id) })
            "
            @click="onHeaderSort(header.column)"
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
                :disabled="locked"
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
      <TableBody v-if="meta.isLoading || meta.hasEmptyState" v-auto-animate>
        <template v-if="meta.isLoading">
          <TableRow v-for="placeholder in SKELETON_ROWS" :key="placeholder">
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

        <TableEmpty v-else :colspan="columnCount">
          <ListEmpty :is-filtered="meta.isFiltered" />
        </TableEmpty>
      </TableBody>

      <!-- A record that carries a refusal is a row GROUP of its own, so the one
           ring can enclose the row and the strip under it while the record after
           it sits fully outside (F4/G7). Everything else stays in the single
           group the body has always been, which is where the animation lives
           (E14). -->
      <template v-else>
        <TableBody
          v-for="group in rowGroups"
          :key="group.key"
          v-auto-animate
          :aria-invalid="group.isFailed ? 'true' : undefined"
          :class="rowGroup({ isFailed: group.isFailed })"
        >
          <template v-for="row in group.rows" :key="row.id">
            <TableRow
              :aria-invalid="rowFailure(row.original) ? 'true' : undefined"
              :class="
                dataRow({
                  isMarked: isMarked(row.original),
                  isFailed: !!rowFailure(row.original),
                  isSucceeded: isSucceeded(row.original)
                })
              "
            >
              <TableCell v-for="element in columnElements" :key="element.scope">
                <div :class="styles.listSurface.cellContent">
                  <CellDispatcher :element="element" :row="row.original" />
                </div>
              </TableCell>
              <TableCell
                v-if="meta.hasRowActions"
                :class="styles.listSurface.actionsCell"
              >
                <ActionSlots
                  icon-only
                  :actions="rowActionItems(row.original)"
                  :locked="locked"
                />
              </TableCell>
            </TableRow>

            <!-- The refusal rides UNDER the row it happened to, inside the same
                 ring, so the two read as one record in an error state (E12/F4). -->
            <TableRow
              v-if="rowFailure(row.original)"
              :class="styles.listSurface.failureRow"
            >
              <TableCell
                :colspan="columnCount"
                :class="styles.listSurface.failureCell"
              >
                <RowFailure
                  :message="rowFailure(row.original) || ''"
                  @dismiss="dismissRow(row.original)"
                />
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </template>
    </Table>

    <ListEmpty v-else-if="meta.hasEmptyState" :is-filtered="meta.isFiltered" />

    <!-- A data-array-without-table descriptor still renders every row,
         read-only — never blank. The DECLARATION drives it exactly as it drives
         the table, so the same columns are shown, under the same labels, and a
         property nobody declared is as absent here as it is there (C15). -->
    <ul v-else :class="styles.listSurface.rowList">
      <li
        v-for="(row, index) in rows"
        :key="rowKey(row, index)"
        :aria-invalid="rowFailure(row) ? 'true' : undefined"
        :class="rowListItem({ isFailed: !!rowFailure(row) })"
      >
        <div :class="styles.listSurface.rowListFields">
          <span
            v-for="element in columnElements"
            :key="element.scope"
            :class="styles.listSurface.rowListField"
          >
            <strong>{{ t(element.i18n) }}</strong>
            <CellDispatcher :element="element" :row="row" />
          </span>
        </div>
        <ActionSlots
          v-if="rowActionItems(row).length"
          icon-only
          :actions="rowActionItems(row)"
          :locked="locked"
        />
        <RowFailure
          v-if="rowFailure(row)"
          :message="rowFailure(row) || ''"
          :class="styles.listSurface.rowListFailure"
          @dismiss="dismissRow(row)"
        />
      </li>
    </ul>

    <!-- The ui Pagination exposes no disabled channel — only `loading`, which
         would say a page is on its way that never is — so the lock is the
         REGION's: `inert` takes the arrows out of the pointer's and the tab
         order's reach, the muting says so, and the reason is the element's own
         title (`R6-23`). Geometry is untouched either way. -->
    <div
      v-if="meta.hasTable && !meta.isEmpty && !meta.isLoading"
      :class="paginationRegion({ isLocked: !!locked })"
      :aria-disabled="locked || undefined"
      :inert="locked || undefined"
      :title="locked ? t('labs.replay_locked') : undefined"
      data-test-key="pagination-region"
      :data-test-value="locked ? 'locked' : undefined"
    >
      <Pagination
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

    <ManageDialog
      v-if="manage"
      :key="manageKey"
      :handoff="manage.handoff"
      :context="manage.context"
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
 * Filtering has exactly ONE surface: `FilterBar` (FE-1335's schema-driven bar)
 * over the composable-owned criteria. It leads three rows — the facets, the
 * refinements they produced, and what the collection amounts to plus how it is
 * drawn (G3 · G5 · H1). The collection's OWN action is not among them: the
 * surface still owns the editor that action opens and hands the control up
 * already bound, for the page header to render beside its title (G4). A module
 * with no table channel (`hasDataArray` without `hasTable`) degrades to a
 * read-only row list instead of rendering blank.
 *
 * EVERY column, cell treatment, label and action is the SCENARIO's own
 * declaration (`presentation`), never inferred: the surface has no vocabulary
 * of any module's fields or action names, so a column exists because it was
 * declared and an action is offered because the row's own meta permits it
 * (C5 · C10 · C11 · C12 · C15). The same rows draw as CARDS from the scenario's
 * second declaration, and creating or editing one is a declared HANDOFF to the
 * module's own editor, whose form is that composable's schemas (C1 · C2 · C13).
 *
 * The table is also the FRAME (C8/C9): loading and empty are drawn inside it,
 * under the real headers, so nothing the user is waiting for moves when the
 * rows land.
 *
 * While a scenario drives it the surface is a PLAYBACK, so every control that
 * WRITES is locked and says why (`R6-23`). Two mechanisms, each for its own
 * reason: a control the ui package gives a `disabled` channel takes it, which
 * is what makes it look refused and keeps it out of the tab order; the chips
 * and the pagination arrows have no such channel, so their REGION is made
 * `inert` and muted instead. Reading is never locked — the rows, the count and
 * the chips are what a replay is watched through.
 */

import { vAutoAnimate } from "@formkit/auto-animate";
import { toDataPath } from "@jsonforms/core";
import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed, onUnmounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { SortDirection } from "@upmind-automation/headless";
import {
  Button,
  Card,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  useStyles
} from "@upmind-automation/upmind-ui";
import { usePlaygroundUrlState } from "../../../../../app/composables/usePlaygroundUrlState";
import {
  clearScenarioStage,
  useScenarioStage
} from "../../composables/useScenarioStage";
import { TableIntentTypes } from "../../composables/useTableChannel";
import { ActionPlacementTypes, CardSlotTypes } from "../../scenario.types";
import {
  isRuleEnabled,
  isRuleVisible,
  resolvePointer,
  resolveScope
} from "../../scenario.utils";
import ActionSlots from "../ActionSlots.vue";
import { CellDispatcher, CellSizingTypes, resolveCellSizing } from "../cells";
import DisplayRow from "../DisplayRow.vue";
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
  paginationRegion,
  rowGroup,
  rowListItem
} from "./ListSurface.styles";
import { ListViewTypes } from "./ListSurface.types";
import RowFailure from "./RowFailure.vue";
import {
  filter,
  find,
  first,
  forEach,
  get,
  includes,
  intersection,
  isEmpty,
  isFunction,
  isNil,
  isString,
  join,
  last,
  map,
  noop,
  reduce,
  reject,
  some,
  split,
  toString
} from "lodash-es";
import type { DeclaredSortField } from "../../composables/useTableChannel.types";
import type {
  ScenarioAction,
  TableCell as DeclaredCell
} from "../../scenario.types";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { ColumnOption } from "../ColumnPicker.types";
import type { ManageDialogProps } from "../ManageDialog.types";
import type { SortField } from "../SortControl.types";
import type { ListRow, ListSurfaceProps } from "./ListSurface.types";
import type {
  Column,
  ColumnDef,
  Row,
  SortDirection as TableSortDirection,
  SortingState
} from "@tanstack/vue-table";
import type { TableModel } from "@upmind-automation/scenario-harness";
// -----------------------------------------------------------------------------

const props = defineProps<ListSurfaceProps>();

const emit = defineEmits<{
  /**
   * The collection's own actions, bound to the handoffs this surface owns, for
   * the page to render beside its title (G4). The control leaves the display
   * cluster; the editor it opens does not leave the list.
   */
  "update:collectionActions": [actions: ActionSlotItem[]];
}>();

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
  // A refused scope is the one state a presented list does NOT keep its table
  // through: the rows in hand belong to an identity this surface may no longer
  // address, so the notice takes their place however far the list had got.
  if (state.value === ModuleState.UNSERVED) return state.value;
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

// The COLLECTION's own read is what failed when the module holds a verdict this
// surface did not fire itself: an action's refusal is reported through
// `feedback` and leaves the rows it came back with in hand, while a failed load
// leaves the surface holding nothing it can vouch for.
const isLoadFailed = computed(
  () => state.value === ModuleState.ERROR && !isNil(verdict.value)
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

/**
 * Every column the table DECLARES, in declaration order — the header labels,
 * the cell renderers, the column order and the picker's whole option list, one
 * entry per Control (`R6-35`). Undeclared row keys never render.
 */
const declaredColumns = computed<DeclaredCell[]>(
  () => props.presentation?.table?.elements ?? []
);

/** The same row's declared CARD fields — the scenario's second declaration. */
const cardElements = computed<DeclaredCell[]>(
  () => props.presentation?.card?.elements ?? []
);

function cardSlot(slot: CardSlotTypes): DeclaredCell[] {
  return filter(cardElements.value, element => element.options?.slot === slot);
}

/**
 * The row's own flag — the boolean an icon cell draws (C12). With the marker
 * channel gone (`R6-34`) the cell IS the declaration: the row the star is
 * filled on is the row the treatment answers to, so the two cannot disagree.
 */
function isMarked(row: ListRow): boolean {
  return some(
    filter(declaredColumns.value, { type: "TableCellIcon" }),
    element => !!resolveScope(row, element.scope)
  );
}

// A table needs BOTH the controlled channel and a declared column set: with
// key-sniffing gone, a scenario that declares no table has none to draw and
// degrades to the read-only list rather than rendering empty headers.
const hasTable = computed(
  () => !!props.table && !isEmpty(declaredColumns.value)
);

const hasCardView = computed(
  () => hasTable.value && !isEmpty(cardElements.value)
);

// Which view is on is URL state, not the renderer's own (AC9.1): a colleague
// opening the link lands on the view he was sent to. It costs no request either
// way — the rows in hand are simply drawn from the scenario's other
// declaration, and the writer never touches the router (AC9.3).
const url = usePlaygroundUrlState();

const view = computed<ListViewTypes>(() =>
  url.view.value === ListViewTypes.CARD
    ? ListViewTypes.CARD
    : ListViewTypes.TABLE
);

function onView(next: ListViewTypes): void {
  url.view.value = next;
}

const isCardView = computed(
  () => hasCardView.value && view.value === ListViewTypes.CARD
);

/** A column's own key — the field its declared scope addresses. */
function columnKey(element: DeclaredCell): string {
  return toDataPath(element.scope);
}

/**
 * Which declared columns are DRAWN. The url names them, so the set round-trips
 * and pastes exactly as the view does (`R6-25`); absent — or naming nothing the
 * table declares — the declaration's own list is the default, which is what
 * makes the uischema the default visible set. The order is always the
 * DECLARATION's: the picker chooses what is drawn, never where.
 */
const visibleKeys = computed<string[]>(() => {
  const declaredKeys = map(declaredColumns.value, columnKey);
  const chosen = intersection(declaredKeys, split(url.columns.value, ","));
  return isEmpty(chosen) ? declaredKeys : chosen;
});

const columnElements = computed<DeclaredCell[]>(() =>
  filter(declaredColumns.value, element =>
    includes(visibleKeys.value, columnKey(element))
  )
);

/**
 * The picker's options — every declared column, saying whether it is drawn.
 * Empty in card view: cards are the scenario's OTHER declaration and have no
 * columns to hide.
 */
const pickerColumns = computed<ColumnOption[]>(() =>
  isCardView.value
    ? []
    : map(declaredColumns.value, element => ({
        value: columnKey(element),
        label: t(element.i18n),
        isVisible: includes(visibleKeys.value, columnKey(element))
      }))
);

function onColumns(next: string[]): void {
  url.columns.value = join(next, ",");
}

/**
 * The collection's whole ordering vocabulary — the QUERY SCHEMA's own sort
 * enum, never a second list beside it (`R6-28`). A schema that declares none
 * leaves the collection unordered, which is where a module with no query schema
 * already stands.
 */
const sortOptions = computed<DeclaredSortField[]>(
  () => declared.value?.sort ?? []
);

/**
 * The toolbar control's options — the SAME list a header writes from, so
 * ordering has one source of truth in both views (`P1-R9`/`G3`). A field the
 * schema does not title reads as its own wire name, which is the untitled
 * column saying so rather than the option going missing.
 */
const sortFields = computed<SortField[]>(() =>
  map(sortOptions.value, option => ({
    value: option.field,
    label: option.i18n ? t(option.i18n) : option.field
  }))
);

/**
 * The wire field a COLUMN's header writes — the field the column itself draws,
 * where the schema orders on it. A presentation composite points at no single
 * field, so a status cell built from several flags stays a column and offers no
 * sort (`R6-6b`).
 */
function sortField(element: DeclaredCell): string | undefined {
  return find(sortOptions.value, { field: toDataPath(element.scope) })?.field;
}

/**
 * A column's id in the table model. It IS the wire sort field wherever one is
 * declared, so the model's sort entry, the header's own indicator, the emitted
 * intent and the width the frame reserves all name the same thing with nothing
 * to translate between them.
 */
function columnId(element: DeclaredCell): string {
  return sortField(element) ?? columnKey(element);
}

const columns = computed<ColumnDef<ListRow>[]>(() =>
  map(columnElements.value, element => ({
    id: columnId(element),
    header: t(element.i18n),
    accessorFn: (row: ListRow) => resolveScope(row, element.scope),
    enableSorting: !!sortField(element)
  }))
);

/**
 * Which of the drawn columns measure to their CONTENT — each cell renderer's
 * own answer (`R7-2`), so the frame reserves a glyph column's width without
 * holding any notion of what a glyph is, and every column that ever draws one
 * is sized the same way.
 */
const contentColumns = computed<string[]>(() =>
  map(
    filter(
      columnElements.value,
      element => resolveCellSizing(element) === CellSizingTypes.CONTENT
    ),
    columnId
  )
);

/** The empty state spans every column the frame draws, the actions one included. */
const columnCount = computed(
  () => columnElements.value.length + (meta.value.hasRowActions ? 1 : 0)
);

const sortingState = computed<SortingState>(() =>
  map(tableModel.value.sort, entry => ({
    id: entry.field,
    desc: entry.dir === SortDirection.DESC
  }))
);

/**
 * The ONE way this surface writes a sort — a header click and the toolbar
 * control both land here, so the two can never disagree about the criteria.
 */
function emitSort(sort: TableModel["sort"]): void {
  props.table?.emit({ type: TableIntentTypes.SORT, sort });
}

/**
 * A header click writes the WHOLE model, exactly as the toolbar control does.
 * TanStack's own toggle keeps every OTHER entry of the sort state in place, so
 * the same intent — "order by this column" — reached the wire as two different
 * orders depending on which control was used (`P1-R9`, `R6-6`). Picking a new
 * column keeps the direction and clicking the active one flips it, which is the
 * toolbar's Select and its direction button respectively.
 */
function onHeaderSort(column: Column<ListRow>): void {
  // The header cell is the hit area, so the disabled Button inside it cannot be
  // what refuses the write while a scenario drives the collection (`R6-23`).
  if (props.locked || !column.getCanSort()) return;

  const primary = first(tableModel.value.sort);
  const flipped =
    primary?.dir === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;

  emitSort([
    {
      field: column.id,
      dir:
        primary?.field === column.id
          ? flipped
          : (primary?.dir ?? SortDirection.ASC)
    }
  ]);
}

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
  }
});

function sortIcon(direction: false | TableSortDirection): string {
  if (direction === SortDirection.ASC) return "chevron-up";
  if (direction === SortDirection.DESC) return "chevron-down";
  return "chevron-selector-vertical";
}

const pagination = computed(() => tableModel.value.pagination);

// The total is the COLLECTION's own claim, so a read that failed has none to
// make: the last good one would put a size on screen that nothing drawn came
// from (`S16`/`G13`). How many rows are drawn stays the surface's to say.
const reportedTotal = computed(() =>
  isLoadFailed.value ? undefined : pagination.value.total
);

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

/** One editor instance per RECORD — never one carried across rows. */
const manageKey = computed(
  () => `${manage.value?.context?.type ?? "new"}:${manage.value?.context?.id}`
);

function openHandoff(action: ScenarioAction, row?: ListRow): void {
  const handoff = get(props.handoffs, action.handoff as string);
  if (!handoff) return;

  const id =
    handoff.context && row
      ? resolvePointer(row, handoff.context.from)
      : undefined;

  manage.value = {
    handoff,
    // A context is only ever COMPLETE (`R6-30c`): no id off the row means a
    // record that does not exist yet, which the editor boots fresh.
    context:
      handoff.context && !isNil(id)
        ? { type: handoff.context.type, id: toString(id) }
        : undefined
  };
}

// --- actions — every one DECLARED by the scenario, then gated on
// `snapshot.actions` (the booted cell's own live-name list, the same gate
// ActionPanelSurface trusts) so a declaration naming a capability the live port
// does not expose simply never surfaces that control.
// ONE declared list serves both surfaces (`R6-33`): a control fired ON a record
// is the row's, and the one fired with no record at all is the collection's,
// which is the whole of what the placement distinguishes.
const declaredActions = computed<ScenarioAction[]>(
  () => props.presentation?.actions?.elements ?? []
);

const rowActions = computed<ScenarioAction[]>(() =>
  reject(declaredActions.value, { placement: ActionPlacementTypes.HEADER })
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

/** The control ONE action on ONE row is fired from — what its outcome is keyed by. */
function rowControl(action: ScenarioAction, row: ListRow): string {
  return `${action.name}:${row.id}`;
}

function rowActionItems(row: ListRow): ActionSlotItem[] {
  return map(availableActions(row), action => {
    const control = rowControl(action, row);
    return {
      name: action.name,
      label: t(action.i18n),
      icon: action.icon,
      color: action.color,
      variant: action.variant,
      placement: action.placement,
      // The precondition is the ROW's own — a rule over the meta the record
      // itself carries, never a client-side guess about what the API allows.
      // A scenario driving the surface refuses every one of them (`R6-23`): a
      // hand firing a row action mid-replay writes what the script did not.
      disabled: props.locked || !isRuleEnabled(action, row),
      // In flight says so on the control that was clicked, in the Button's own
      // treatment: an action nobody can see working reads as an action that did
      // nothing (E12).
      loading: feedback.isPending(control),
      onSelect: () => pressRowAction(action, row)
    };
  });
}

/** What pressing ONE row's control does — the only path, hand or scenario. */
function pressRowAction(action: ScenarioAction, row: ListRow): Promise<void> {
  if (action.handoff) {
    openHandoff(action, row);
    return Promise.resolve();
  }

  return feedback
    .fire(rowControl(action, row), () => props.actions[action.name](row.id), {
      success: t(get(action, ["feedback", "success"], "")),
      failure: t(get(action, ["feedback", "failure"], ""))
    })
    .then(noop);
}

/** Every control this row can fire, whether or not it is offered right now. */
function rowControls(row: ListRow): string[] {
  return map(rowActions.value, action => rowControl(action, row));
}

/**
 * What this row's last refused action said — the API's own sentence where it
 * gave one. Held until the user dismisses it or fires the action again, so a
 * refusal is answered on the record it happened to rather than only in a toast
 * that has already gone.
 */
function rowFailure(row: ListRow): string | undefined {
  const failure = find(map(rowControls(row), feedback.failure), isString);
  if (isNil(failure)) return undefined;
  return failure || t("error.something_went_wrong");
}

/** True while one of this row's actions is still worth pointing at (E13). */
function isSucceeded(row: ListRow): boolean {
  return some(rowControls(row), feedback.isSucceeded);
}

function dismissRow(row: ListRow): void {
  forEach(rowControls(row), feedback.dismiss);
}

/**
 * The records as the table BODY draws them. A refused record is a group of its
 * own so one ring can enclose its row and the strip under it (F4/G7) — `tbody`
 * is the only element a table lets the pair share. Every other record stays in
 * the run it was already in, so with nothing refused the body is the single
 * group, and the single animated list, it has always been (E14).
 */
const rowGroups = computed(() =>
  reduce(
    vueTable.getRowModel().rows,
    (
      groups: { key: string; isFailed: boolean; rows: Row<ListRow>[] }[],
      row
    ) => {
      const isFailed = !!rowFailure(row.original);
      const open = last(groups);
      if (open && !isFailed && !open.isFailed) open.rows.push(row);
      else groups.push({ key: row.id, isFailed, rows: [row] });
      return groups;
    },
    []
  )
);

const collectionActionItems = computed<ActionSlotItem[]>(() =>
  map(
    filter(
      declaredActions.value,
      action =>
        action.placement === ActionPlacementTypes.HEADER &&
        isActionAvailable(action)
    ),
    action => ({
      name: action.name,
      label: t(action.i18n),
      icon: action.icon,
      color: action.color,
      variant: action.variant,
      placement: action.placement,
      loading: feedback.isPending(action.name),
      onSelect: () => pressCollectionAction(action)
    })
  )
);

/** What pressing ONE header control does — the only path, hand or scenario. */
function pressCollectionAction(action: ScenarioAction): Promise<void> {
  if (action.handoff) {
    openHandoff(action);
    return Promise.resolve();
  }

  return feedback
    .fire(action.name, () => props.actions[action.name](), {
      success: t(get(action, ["feedback", "success"], "")),
      failure: t(get(action, ["feedback", "failure"], ""))
    })
    .then(noop);
}

// --- The stage. What this surface DRAWS is what a scenario acts on, so a step
//     is a press rather than a reach past the screen into the composable.
const stage = useScenarioStage();

/** The row a control names, by the id the collection itself keys rows on. */
function stagedRow(rowId: string): ListRow {
  const row = find(rows.value, { id: rowId });
  if (!row) throw new Error(`no row "${rowId}" is on screen to press`);

  return row;
}

function stagedAction(actionName: string): ScenarioAction {
  const action = find(declaredActions.value, { name: actionName });
  if (!action) throw new Error(`no control is declared for "${actionName}"`);

  return action;
}

stage.registerCollection({
  press: (actionName, rowId) => {
    const action = stagedAction(actionName);
    return isNil(rowId)
      ? pressCollectionAction(action)
      : pressRowAction(action, stagedRow(rowId));
  },
  offers: (actionName, rowId) => {
    const action = find(declaredActions.value, { name: actionName });
    if (!action || !isActionAvailable(action)) return false;

    return isNil(rowId)
      ? action.placement === ActionPlacementTypes.HEADER
      : isRuleVisible(action, stagedRow(rowId));
  }
});

onUnmounted(() => clearScenarioStage("collection"));

// The page renders them; the list keeps the editor they open, so they are
// published already bound rather than re-derived from the declaration by
// whoever draws the header (G4).
watchEffect(() =>
  emit("update:collectionActions", collectionActionItems.value)
);

// The component's ONE flag surface — every is/has/can flag the template reads,
// and the same object `useStyles` resolves its CVA variants from.
const meta = computed(() => ({
  state: state.value,
  isLoading: state.value === ModuleState.LOADING,
  isEmpty: isEmpty(rows.value),
  // *Nothing here yet* is a CLAIM about the collection, so it is drawn only
  // where the surface can vouch for it: a failed read has no rows AND no
  // answer, and the notice above it already says which of the two happened.
  hasEmptyState: isEmpty(rows.value) && !isLoadFailed.value,
  hasTable: hasTable.value,
  // The card is a SECOND declaration over the same rows, so the toggle exists
  // only where the scenario wrote one.
  hasCardView: hasCardView.value,
  isCardView: isCardView.value,
  // The module's own answer (`useMeta().isFiltered`), never a renderer-side
  // guess off the flattened filter model: *empty because nothing exists* and
  // *empty because your filters match nothing* are different states.
  isFiltered: !!props.snapshot.meta.isFiltered,
  hasRowActions: !isEmpty(filter(rowActions.value, isActionAvailable)),
  // Nothing to steer with and nothing to say about the collection is no cluster
  // at all — never an empty line of chrome above the records.
  hasControls: !!props.criteria || hasTable.value
}));

const styles = useStyles(["listSurface"], meta, config);
</script>
