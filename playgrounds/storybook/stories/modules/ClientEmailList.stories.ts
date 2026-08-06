import { computed, shallowRef } from "vue";
import {
  Alert,
  Form,
  Icon,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow
} from "@upmind-automation/upmind-ui";
import { bootClientEmails, outboundRequests } from "./client-email.demo";
import { filter, find, get, includes, last, map } from "lodash-es";
import type { Meta, StoryObj } from "@storybook/vue3";
import type {
  UseClientEmailsActions,
  UseClientEmailsContext
} from "@upmind-automation/headless/modules/client-email";
// -----------------------------------------------------------------------------

/** The collection's whole request state, as its own context publishes it. */
type QueryModel = UseClientEmailsContext["query"]["value"];

/** One row of the collection, as its own context publishes it. */
type EmailRow = UseClientEmailsContext["data"]["value"][number];

/** The live collection, resolved once and held — never re-derived per render. */
type LiveCollection = {
  context: UseClientEmailsContext;
  actions: UseClientEmailsActions;
};

/**
 * One rendered column. `sortField` is the WIRE column name, present only where
 * the query schema's `sort` enum declares the field sortable — the schema is the
 * authority on what a header click may ask for, not this list.
 */
type DemoColumn = {
  label: string;
  sortField?: string;
  value: (row: EmailRow) => string;
};

const COLUMNS: DemoColumn[] = [
  { label: "Email", sortField: "email", value: row => row.email ?? "" },
  {
    label: "Default",
    sortField: "default",
    value: row => (row.meta.isDefault ? "Yes" : "No")
  },
  { label: "Verified", value: row => (row.meta.isVerified ? "Yes" : "No") },
  { label: "Bounced", value: row => (row.meta.isBounced ? "Yes" : "No") }
];

// -----------------------------------------------------------------------------

const meta: Meta = {
  parameters: {
    docs: {
      story: {
        iframeHeight: 900
      },
      description: {
        component:
          "The client-email collection driven by its ONE query schema (FE-2977). " +
          "The filter bar is `useQuerySchema()` + `useQueryUischema()` rendered by " +
          "the JSONForms `Form`; the rows are the upmind-ui table primitives; the " +
          "sort, the narrowing and the paging all go through the composable's own " +
          "`filterBy` / `sortBy` / `nextPage` actions. The panel underneath prints " +
          "the derived query model beside the request that actually went out, so " +
          "the schema-to-wire mapping is visible without opening devtools. Rows " +
          "come from the module's recorded fixtures, served offline."
      }
    }
  },
  render: () => ({
    components: {
      Alert,
      Form,
      Icon,
      Pagination,
      Table,
      TableBody,
      TableCell,
      TableEmpty,
      TableHead,
      TableHeader,
      TableRow
    },
    setup() {
      const collection = shallowRef<LiveCollection>();
      const filterForm = shallowRef<QueryModel>({});
      const notice = shallowRef<string>();

      bootClientEmails()
        .then(emails => {
          const context = emails.useContext();
          filterForm.value = context.query.value;
          collection.value = { context, actions: emails.useActions() };
        })
        .catch((raised: Error) => {
          notice.value = `Demo rig failed to boot: ${raised.message}`;
        });

      const rows = computed<EmailRow[]>(
        () => collection.value?.context.data.value ?? []
      );
      const queryModel = computed<QueryModel>(
        () => collection.value?.context.query.value ?? {}
      );
      const pagination = computed(
        () => collection.value?.context.pagination.value
      );
      const schemas = computed(() => collection.value?.context.schemas.query);
      const error = computed(() => collection.value?.context.error.value);

      /** The fields the query schema declares sortable. */
      const sortableFields = computed<string[]>(
        () =>
          get(schemas.value?.schema, [
            "properties",
            "sort",
            "items",
            "properties",
            "field",
            "enum"
          ]) ?? []
      );

      const columns = computed<DemoColumn[]>(() =>
        map(COLUMNS, column => ({
          ...column,
          sortField: includes(sortableFields.value, column.sortField)
            ? column.sortField
            : undefined
        }))
      );

      const lastEmailRequest = computed(() =>
        last(filter(outboundRequests.value, url => includes(url, "/emails")))
      );

      /** The outbound request's own params — the translated query, off the wire. */
      const wireParams = computed<Array<[string, string]>>(() => {
        if (!lastEmailRequest.value) return [];
        return [...new URL(lastEmailRequest.value).searchParams.entries()];
      });

      /** This field's entry in the live sort model, if it carries one. */
      function sortEntry(field?: string) {
        return field ? find(queryModel.value.sort, { field }) : undefined;
      }

      function sortIcon(field?: string): string {
        const entry = sortEntry(field);
        if (!entry) return "chevron-selector-vertical";
        return entry.dir === "asc" ? "chevron-up" : "chevron-down";
      }

      /**
       * asc → desc → cleared. Clearing hands the composable an EMPTY array,
       * which the schema's own `sort` default refills on the next parse — the
       * FE-2977 behaviour that replaced the hand-rolled sort floor.
       */
      function toggleSort(field?: string): void {
        if (!field || !collection.value) return;
        const entry = sortEntry(field);
        const next = !entry
          ? [{ field, dir: "asc" as const }]
          : entry.dir === "asc"
            ? [{ field, dir: "desc" as const }]
            : [];
        collection.value.actions.sortBy(next);
      }

      function onFilter(model: QueryModel): void {
        filterForm.value = model;
        collection.value?.actions.filterBy(model.filters ?? {});
      }

      function onPaginate(direction: "next" | "prev"): void {
        notice.value = undefined;
        try {
          if (direction === "next") collection.value?.actions.nextPage();
          else collection.value?.actions.prevPage();
        } catch (raised) {
          notice.value = (raised as Error).message;
        }
      }

      return {
        columns,
        error,
        filterForm,
        notice,
        onFilter,
        onPaginate,
        pagination,
        queryModel,
        rows,
        schemas,
        sortIcon,
        toggleSort,
        wireParams
      };
    },
    template: `
      <div class="flex w-full flex-col gap-6 p-6">
        <Alert
          v-if="error"
          variant="minimal"
          color="danger"
          icon="alert-triangle"
          :title="error.message"
          description="Surfaced from useContext().error — an invalid query model reports its ajv errors instead of being silently reverted."
        />

        <!-- The ONE query schema, drawn by its own uischema -->
        <Form
          no-actions
          :schema="schemas?.schema"
          :uischema="schemas?.uischema"
          :model-value="filterForm"
          @update:model-value="onFilter"
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-for="column in columns" :key="column.label">
                <button
                  v-if="column.sortField"
                  type="button"
                  class="flex items-center gap-1"
                  @click="toggleSort(column.sortField)"
                >
                  {{ column.label }}
                  <Icon :icon="sortIcon(column.sortField)" size="2xs" />
                </button>
                <span v-else>{{ column.label }}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in rows" :key="row.id">
              <TableCell v-for="column in columns" :key="column.label">
                {{ column.value(row) }}
              </TableCell>
            </TableRow>
            <TableEmpty v-if="!rows.length" :colspan="columns.length">
              No address matches the active filters.
            </TableEmpty>
          </TableBody>
        </Table>

        <Pagination
          v-if="pagination"
          :total="pagination.total"
          :page="pagination.page"
          :pages="pagination.pages"
          :limit="pagination.limit || pagination.total"
          @next="onPaginate('next')"
          @prev="onPaginate('prev')"
        />

        <Alert
          v-if="notice"
          variant="minimal"
          color="warning"
          icon="alert-circle"
          :title="notice"
        />

        <div class="grid gap-4 rounded-lg bg-100 p-4 md:grid-cols-2">
          <div>
            <strong class="font-mono text-xs uppercase">Query model — useContext().query</strong>
            <pre class="mt-2 text-xs text-wrap">{{ queryModel }}</pre>
          </div>
          <div>
            <strong class="font-mono text-xs uppercase">Outbound request — the translated wire</strong>
            <ul class="mt-2 font-mono text-xs">
              <li v-for="param in wireParams" :key="param[0]">
                {{ param[0] }} = {{ param[1] }}
              </li>
            </ul>
            <p class="mt-2 text-xs text-500">
              The list is minted with <code>limit: 0</code>, so the collection is
              one page and the pager has nothing to step to.
            </p>
          </div>
        </div>
      </div>
    `
  })
};

export default meta;
type Story = StoryObj;

export const Base: Story = {
  args: {}
};
