<template>
  <Page :data-attrs="{ 'data-test-key': 'client-orders-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.client_orders_title") }}</PageTitle>
      <PageDescription>{{
        t("labs.client_orders_description")
      }}</PageDescription>
    </PageHeader>

    <ScenarioBar
      :player="player"
      :tracks="tracks"
      :states="states"
      class="mb-4"
    />

    <PageBody class="relative gap-6">
      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="flag in metaFlags"
          :key="flag.key"
          size="sm"
          :appearance="flag.value ? 'solid' : 'muted'"
          :data-test-key="flag.key"
          :data-test-value="String(flag.value)"
        >
          {{ flag.label }}
        </Badge>
        <Badge
          v-for="readout in readouts"
          :key="readout.key"
          size="sm"
          appearance="outline"
          :data-test-key="readout.key"
          :data-test-value="readout.value"
        >
          {{ readout.label }}
        </Badge>
        <a
          v-if="meta.showStore.value && meta.storefrontUrl.value"
          :href="meta.storefrontUrl.value"
          data-test-key="client-orders-storefront-link"
        >
          {{ t("labs.client_orders_store") }}
        </a>
      </div>

      <FilterBar
        :criteria="criteria"
        :disabled="isLocked"
        data-test-key="client-orders-schemas-query"
      />

      <Card size="sm" class="gap-3">
        <div class="flex flex-wrap items-end gap-3">
          <Input
            v-model="searchTerm"
            :placeholder="t('labs.client_orders_search')"
            :data-attrs="{ 'data-test-key': 'client-orders-filters-query' }"
            @keyup.enter="actions.filters.query(searchTerm)"
          />
          <Input
            v-model="totalInput"
            :placeholder="t('labs.client_orders_total')"
            :data-attrs="{ 'data-test-key': 'client-orders-filters-total' }"
            @keyup.enter="applyTotal"
          />
          <Input
            v-model="dateCreatedInput"
            :placeholder="t('labs.client_orders_date_created')"
            :data-attrs="{
              'data-test-key': 'client-orders-filters-date-created'
            }"
            @keyup.enter="
              actions.filters.dateCreated(
                dateCreatedInput || undefined,
                dateOperator(dateCreatedInput)
              )
            "
          />
          <Input
            v-model="datePaidInput"
            :placeholder="t('labs.client_orders_date_paid')"
            :data-attrs="{ 'data-test-key': 'client-orders-filters-date-paid' }"
            @keyup.enter="
              actions.filters.datePaid(
                datePaidInput || undefined,
                dateOperator(datePaidInput)
              )
            "
          />
          <Input
            v-model="itemNameInput"
            :placeholder="t('labs.client_orders_item_name')"
            :data-attrs="{ 'data-test-key': 'client-orders-filters-item-name' }"
            @keyup.enter="actions.filters.itemName(itemNameInput || undefined)"
          />
          <Input
            v-model="categoryNameInput"
            :placeholder="t('labs.client_orders_category_name')"
            :data-attrs="{
              'data-test-key': 'client-orders-filters-category-name'
            }"
            @keyup.enter="
              actions.filters.categoryName(categoryNameInput || undefined)
            "
          />
          <Input
            v-model="serviceIdentifierInput"
            :placeholder="t('labs.client_orders_service_identifier')"
            :data-attrs="{
              'data-test-key': 'client-orders-filters-service-identifier'
            }"
            @keyup.enter="
              actions.filters.serviceIdentifier(
                serviceIdentifierInput || undefined
              )
            "
          />
        </div>

        <div
          class="flex flex-wrap gap-2"
          data-test-key="client-orders-filters-status"
        >
          <Button
            v-for="choice in STATUS_CHOICES"
            :key="choice"
            size="sm"
            variant="outline"
            :disabled="isLocked"
            :data-attrs="{
              'data-test-key': 'client-orders-filters-status-choice',
              'data-test-value': choice
            }"
            @click="actions.filters.status([choice])"
          >
            {{ t(`labs.client_orders_status_${statusSlug(choice)}`) }}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            :disabled="isLocked"
            :data-attrs="{
              'data-test-key': 'client-orders-filters-status-clear'
            }"
            @click="actions.filters.status()"
          >
            {{ t("action.clear") }}
          </Button>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <Input
            v-model="filterByInput"
            :placeholder="t('labs.client_orders_filter_by')"
            :data-attrs="{ 'data-test-key': 'client-orders-filter-by' }"
            @keyup.enter="
              run(() => actions.filterBy(JSON.parse(filterByInput)))
            "
          />
          <Input
            v-model="sortByInput"
            :placeholder="t('labs.client_orders_sort_by')"
            :data-attrs="{ 'data-test-key': 'client-orders-sort-by' }"
            @keyup.enter="run(() => actions.sortBy(JSON.parse(sortByInput)))"
          />
        </div>

        <div class="flex flex-wrap gap-2" data-test-key="client-orders-sort">
          <template v-for="column in SORT_COLUMNS" :key="column">
            <Button
              v-for="direction in SORT_DIRECTIONS"
              :key="`${column}-${direction}`"
              size="sm"
              variant="outline"
              :disabled="isLocked"
              :data-attrs="{
                'data-test-key': 'client-orders-sort-option',
                'data-test-value': `${column}:${direction}`
              }"
              @click="actions.sort(column, direction)"
            >
              {{ sortFieldLabel(column) }} {{ direction }}
            </Button>
          </template>
        </div>
      </Card>

      <Alert
        v-if="meta.hasError.value || actionError"
        variant="danger"
        appearance="muted"
        :title="
          actionError ||
          context.error.value?.message ||
          t('error.something_went_wrong')
        "
        :data-attrs="{ 'data-test-key': 'client-orders-alert' }"
      />

      <div v-if="meta.isLoading.value" class="flex justify-center p-8">
        <Spinner :label="t('text.loading')" />
      </div>

      <EmptyState
        v-else-if="meta.isEmpty.value"
        :title="t('labs.client_orders_empty')"
        :data-attrs="{ 'data-test-key': 'client-orders-empty' }"
      >
        <template #icon><Icon icon="receipt" /></template>
      </EmptyState>

      <ul v-else class="flex flex-col gap-2" data-test-key="client-orders-data">
        <li
          v-for="order in context.data.value"
          :key="order.id"
          class="flex flex-wrap items-center gap-3"
          data-test-key="client-orders-row"
          :data-test-value="order.id"
        >
          <span class="font-medium">{{ order.number }}</span>
          <span>{{ order.status?.name }}</span>
          <span>{{ order.total_amount_formatted }}</span>
          <span>{{ order.created_at }}</span>
          <Button
            size="sm"
            variant="ghost"
            :data-attrs="{
              'data-test-key': 'client-orders-get-one',
              'data-test-value': order.id
            }"
            @click="picked = context.getOne(order.id)"
          >
            {{ t("action.view") }}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            :data-attrs="{
              'data-test-key': 'client-orders-find-one',
              'data-test-value': order.number
            }"
            @click="picked = context.findOne({ number: order.number })"
          >
            {{ t("labs.client_orders_find") }}
          </Button>
        </li>
      </ul>

      <p
        v-if="picked"
        data-test-key="client-orders-picked"
        :data-test-value="picked.id"
      >
        {{ picked.number }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          :disabled="isLocked || !meta.hasPrevPage.value"
          :data-attrs="{ 'data-test-key': 'client-orders-prev-page' }"
          @click="actions.prevPage()"
        >
          {{ t("labs.client_orders_prev_page") }}
        </Button>
        <span
          data-test-key="client-orders-pagination"
          :data-test-value="`${context.pagination.value?.page ?? 1}/${context.pagination.value?.pages ?? 1}`"
        >
          {{ context.pagination.value?.page ?? 1 }} /
          {{ context.pagination.value?.pages ?? 1 }} ·
          {{ context.pagination.value?.total ?? 0 }}
        </span>
        <Button
          size="sm"
          variant="outline"
          :disabled="isLocked || !meta.hasNextPage.value"
          :data-attrs="{ 'data-test-key': 'client-orders-next-page' }"
          @click="actions.nextPage()"
        >
          {{ t("labs.client_orders_next_page") }}
        </Button>
        <Input
          v-model="pageInput"
          :placeholder="t('labs.client_orders_page')"
          :data-attrs="{ 'data-test-key': 'client-orders-set-page' }"
          @keyup.enter="actions.setPage(toNumber(pageInput))"
        />
        <Input
          v-model="limitInput"
          :placeholder="t('labs.client_orders_limit')"
          :data-attrs="{ 'data-test-key': 'client-orders-set-limit' }"
          @keyup.enter="actions.setLimit(toNumber(limitInput))"
        />
        <Button
          size="sm"
          variant="ghost"
          :data-attrs="{ 'data-test-key': 'client-orders-refresh' }"
          @click="run(() => actions.refresh())"
        >
          {{ t("action.refresh") }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :data-attrs="{ 'data-test-key': 'client-orders-invalidate' }"
          @click="run(() => actions.invalidate())"
        >
          {{ t("labs.client_orders_invalidate") }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :data-attrs="{
            'data-test-key': 'client-orders-is-ready',
            'data-test-value': String(readiness ?? '')
          }"
          @click="run(async () => (readiness = await actions.isReady()))"
        >
          {{ t("labs.client_orders_is_ready") }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :data-attrs="{ 'data-test-key': 'client-orders-reset' }"
          @click="run(() => actions.reset())"
        >
          {{ t("action.reset") }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :data-attrs="{ 'data-test-key': 'client-orders-destroy' }"
          @click="run(() => actions.destroy())"
        >
          {{ t("action.destroy") }}
        </Button>
      </div>

      <pre
        class="text-xs"
        data-test-key="client-orders-query"
        :data-test-value="JSON.stringify(context.query.value)"
        >{{ context.query.value }}</pre
      >

      <div
        v-if="isLocked"
        :class="scenarioPlayground.scrim()"
        :title="t('labs.replay_locked')"
        aria-hidden="true"
        data-test-key="replay-scrim"
      />
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useClientOrders/client-orders.page
 * @description The client order history, drawn directly. It boots
 * `useClientOrders().as(ScopeActorTypes.SELF)` and draws each published
 * member under its own `client-orders-<member>` test key (design 8.12): the
 * meta flags, the raw rows, the page window, the live criteria model, the
 * filter bar over `schemas.query` (written through the module writer
 * `actions.setCriteria`, never the raw `useInternals().query.setCriteria`),
 * each named filter setter, `filterBy`, `sortBy`, `sort`, the page moves,
 * `refresh`, `invalidate`, `isReady`, `reset` and `destroy`.
 */

import { enumToEnumOptionMapper } from "@jsonforms/core";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  Spinner
} from "@upmind/ui";
import { computed, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  ClientOrdersSortableColumn,
  ScopeActorTypes,
  resolveSelfActor,
  useClientOrders
} from "@upmind-automation/client-vue";
import { Icon, useFormI18n } from "@upmind-automation/foundation";
import FilterBar from "../runtime/components/FilterBar.vue";
import ScenarioBar from "../runtime/components/ScenarioBar.vue";
import { useScenarioTransport } from "../runtime/composables/useScenarioTransport";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { registry } from "../runtime/registry";
import { scenarioPlayground } from "../runtime/ScenarioPlayground.styles";
import scenario, { CLIENT_ORDERS_SCENARIO } from "./client-orders.scenario";
import { find, map, toNumber, values } from "lodash-es";
import type { ClientOrderStatusChoice } from "@upmind-automation/client-vue";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import type { IOrder } from "@upmind-automation/types";
import { useActorScope } from "~/composables/scope";

definePageMeta({
  key: route => route.path
});

const STATUS_CHOICES: ClientOrderStatusChoice[] = [
  "invoice_paid",
  "invoice_unpaid,invoice_adjusted",
  "invoice_overdue",
  "invoice_cancelled",
  "invoice_refunded"
];

const SORT_COLUMNS = values(ClientOrdersSortableColumn);

const SORT_DIRECTIONS = ["asc", "desc"] as const;

const RELATIVE_DATE = /^[+-]/;

const { t } = useI18n();
const formI18n = useFormI18n();

const orders = useClientOrders().as(ScopeActorTypes.SELF);
const actions = orders.useActions();
const context = orders.useContext();
const meta = orders.useMeta();
const { query } = orders.useInternals();

/** The column labels off the sort uischema's `i18n` prefix (`<i18n>.<field>`), never the raw enum. */
const sortFields = computed(() =>
  map(SORT_COLUMNS, column =>
    enumToEnumOptionMapper(
      column,
      formI18n.value.translate,
      context.schemas.query.sortUischema.i18n
    )
  )
);

function sortFieldLabel(column: string): string {
  return find(sortFields.value, { value: column })?.label ?? column;
}

const actorScope = useActorScope();

const { tracks, states, player, isLocked } = useScenarioTransport({
  module: scenario.tracks,
  world: useScenarioWorld(registry, { key: CLIENT_ORDERS_SCENARIO }),
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor }),
  reset: actions.reset
});

const criteria = {
  schema: context.schemas.query.schema,
  uischema: context.schemas.query.uischema,
  model: computed(() => query.criteria.value as Record<string, unknown>),
  set: (next: Record<string, unknown>) => actions.setCriteria(next)
};

const searchTerm = ref("");
const totalInput = ref("");
const dateCreatedInput = ref("");
const datePaidInput = ref("");
const itemNameInput = ref("");
const categoryNameInput = ref("");
const serviceIdentifierInput = ref("");
const filterByInput = ref("");
const sortByInput = ref("");
const pageInput = ref("");
const limitInput = ref("");
const picked = ref<IOrder>();
const actionError = ref<string>();
const readiness = ref<boolean>();

const readouts = computed(() => [
  {
    key: "client-orders-error",
    label: "error",
    value: context.error.value?.message ?? ""
  },
  {
    key: "client-orders-storefront-url",
    label: "storefront-url",
    value: meta.storefrontUrl.value ?? ""
  }
]);

const metaFlags = computed(() =>
  map(
    [
      ["client-orders-is-available", meta.isAvailable],
      ["client-orders-is-empty", meta.isEmpty],
      ["client-orders-is-filtered", meta.isFiltered],
      ["client-orders-is-loading", meta.isLoading],
      ["client-orders-has-error", meta.hasError],
      ["client-orders-has-next-page", meta.hasNextPage],
      ["client-orders-has-prev-page", meta.hasPrevPage],
      ["client-orders-has-pages", meta.hasPages],
      ["client-orders-is-multibrand", meta.isMultibrand],
      ["client-orders-show-store", meta.showStore]
    ] as const,
    ([key, flag]) => ({
      key,
      value: !!flag.value,
      label: key.replace("client-orders-", "")
    })
  )
);

function statusSlug(choice: ClientOrderStatusChoice): string {
  return choice.split(",")[0]!.replace("invoice_", "");
}

function dateOperator(value: string): "after" | "gte" {
  return RELATIVE_DATE.test(value) ? "after" : "gte";
}

function applyTotal(): void {
  actions.filters.total(
    totalInput.value === "" ? undefined : toNumber(totalInput.value)
  );
}

async function run(work: () => unknown): Promise<void> {
  actionError.value = undefined;
  try {
    await work();
  } catch (error) {
    actionError.value =
      (error as { message?: string })?.message ??
      t("error.something_went_wrong");
  }
}

onUnmounted(() => actions.destroy());
</script>
