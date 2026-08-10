<template>
  <ModuleStateNotice v-if="notice" :state="notice" :detail="detail" />
  <div v-else :class="styles.listSurface.root">
    <!-- A rejected criteria write leaves the list VALID and showing its last
         good rows, so its verdict belongs beside the table, never in place of
         it: swapping the surface out would unmount the very controls that
         issue the next valid write. -->
    <ModuleStateNotice v-if="verdict" state="error" :detail="verdict" />

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
 * composable owns the model — this surface sorts/paginates nothing
 * itself (`manualSorting`/`manualPagination`, and only
 * `getCoreRowModel()` — no `getSortedRowModel`/`getPaginationRowModel`).
 * Filtering has exactly ONE surface: `FilterBar` (FE-1335's schema-driven
 * bar) over the composable-owned criteria (W-D33, P1-R15). A module
 * with no table channel (`hasDataArray` without `hasTable`) degrades to a
 * read-only row list instead of rendering blank. Row/collection actions bind
 * to the well-known `LIST_SURFACE_ACTION` names only when the live port
 * actually exposes them — never a guessed key.
 */

import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import {
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
import { TableIntentTypes } from "../../../composables/factory/useTableChannel";
import ActionSlots from "../ActionSlots.vue";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { useActionFeedback } from "../useActionFeedback";
import config from "./ListSurface.styles";
import { LIST_SURFACE_ACTION } from "./ListSurface.types";
import {
  entries,
  flatMap,
  get,
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
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/vue-table";
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

const feedback = useActionFeedback();

// The notice stands in for the list only BEFORE the module first presents it. A
// row action that the API refuses lands in the very same `hasError` channel a
// failed load does, and the module keeps it indefinitely — so reading that
// channel afterwards would take the table, its controls and the user's place in
// the list away over one refused row, with nothing left to recover with.
const hasPresented = ref(false);
watchEffect(() => {
  if (state.value === "ready") hasPresented.value = true;
});

const notice = computed(() =>
  hasPresented.value || state.value === "ready" ? undefined : state.value
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

function deriveColumns(data: ListRow[]): ColumnDef<ListRow>[] {
  const columnKeys = uniq(flatMap(data, row => keys(row)));
  const steerable = declared.value;
  return map(columnKeys, key => ({
    id: key,
    header: fieldLabel(key),
    accessorFn: (row: ListRow) => row[key],
    enableSorting: !steerable || includes(steerable.sort, key)
  }));
}

const columns = computed<ColumnDef<ListRow>[]>(() => deriveColumns(rows.value));

const sortingState = computed<SortingState>(() =>
  map(tableModel.value.sort, entry => ({
    id: entry.field,
    desc: entry.dir === "desc"
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
      dir: entry.desc ? "desc" : "asc"
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

function sortIcon(direction: false | "asc" | "desc"): string {
  if (direction === "asc") return "chevron-up";
  if (direction === "desc") return "chevron-down";
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

/**
 * What each row action SAYS when it settles — the shared vocabulary again,
 * grounded on the same client-emails canary the action names themselves are
 * (`LIST_SURFACE_ACTION`). A success that changes no row (`verify` mails a
 * link; the flag flips when the recipient clicks it) has nothing but this to
 * show for itself.
 */
const ACTION_FEEDBACK_KEY = {
  [LIST_SURFACE_ACTION.DELETE]: {
    success: "confirm.email_removed",
    failure: "error.client_email_delete_failed"
  },
  [LIST_SURFACE_ACTION.SET_DEFAULT]: {
    success: "confirm.email_set_default",
    failure: "error.client_email_set_default_failed"
  },
  [LIST_SURFACE_ACTION.RESEND]: {
    success: "confirm.email_verification_sent",
    failure: "error.client_email_verify_failed"
  }
} as const;

/**
 * The precondition each row action carries in the ROW's own meta — never a
 * client-side rule the record does not declare. An action the API refuses on
 * grounds the row cannot express (a default address must be verified first)
 * stays live, and the refusal's own sentence speaks.
 */
const ACTION_PRECONDITION = {
  [LIST_SURFACE_ACTION.DELETE]: (row: ListRow) =>
    get(row, ["meta", "canDelete"]) !== false,
  [LIST_SURFACE_ACTION.SET_DEFAULT]: (row: ListRow) =>
    !get(row, ["meta", "isDefault"]),
  [LIST_SURFACE_ACTION.RESEND]: (row: ListRow) =>
    !get(row, ["meta", "isVerified"])
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
      if (isActionAvailable(key)) {
        const control = `${key}:${row.id}`;
        acc.push({
          name: key,
          label: t(ACTION_LABEL_KEY[key]),
          disabled:
            !ACTION_PRECONDITION[key](row) || feedback.isPending(control),
          onSelect: () =>
            feedback.fire(control, () => props.actions[key](row.id), {
              success: t(ACTION_FEEDBACK_KEY[key].success),
              failure: t(ACTION_FEEDBACK_KEY[key].failure)
            })
        });
      }
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
