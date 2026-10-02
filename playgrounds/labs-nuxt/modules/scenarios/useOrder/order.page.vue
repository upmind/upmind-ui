<template>
  <Page :data-attrs="{ 'data-test-key': 'order-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.order_title") }}</PageTitle>
      <PageDescription>{{ t("labs.order_description") }}</PageDescription>
    </PageHeader>

    <PageBody class="gap-6">
      <EmptyState
        v-if="!manager"
        :title="t('labs.order_needs_id')"
        :data-attrs="{ 'data-test-key': 'order-needs-id' }"
      >
        <template #icon><Icon icon="receipt" /></template>
      </EmptyState>

      <template v-else>
        <div class="flex flex-wrap gap-3">
          <Button
            v-if="!isOpen"
            :data-attrs="{ 'data-test-key': 'order-enter' }"
            @click="enter"
          >
            {{ t("labs.order_enter") }}
          </Button>
          <Button
            v-else
            variant="ghost"
            :data-attrs="{ 'data-test-key': 'order-leave' }"
            @click="isOpen = false"
          >
            {{ t("action.close") }}
          </Button>
        </div>

        <section
          v-if="isOpen"
          class="flex flex-col gap-6"
          data-test-key="order-view"
        >
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
          </div>

          <div v-if="meta!.isLoading.value" class="flex justify-center p-8">
            <Spinner :label="t('text.loading')" />
          </div>

          <Alert
            v-if="meta!.hasError.value || actionError"
            variant="danger"
            appearance="muted"
            :title="
              actionError ||
              context!.error.value?.message ||
              t('error.something_went_wrong')
            "
            :data-attrs="{ 'data-test-key': 'order-alert' }"
          />

          <template v-if="context!.data.value">
            <Hero
              :title="context!.detail.value.number ?? t('labs.order_title')"
              :badge="heroBadge"
              size="lg"
            />

            <Section :label="t('labs.order_summary')" icon="receipt">
              <DescriptionListRoot
                align="between"
                class="gap-y-2"
                data-test-key="order-detail"
              >
                <DescriptionItem
                  v-if="statusName"
                  :term="t('labs.orders_col_status')"
                >
                  <Badge
                    size="sm"
                    appearance="outline"
                    :variant="statusVariant"
                    data-test-key="order-detail-status"
                  >
                    {{ statusName }}
                  </Badge>
                </DescriptionItem>
                <DescriptionItem
                  v-for="row in summaryRows"
                  :key="row.key"
                  :term="t(row.labelKey)"
                >
                  <span :data-test-key="`order-detail-${row.key}`">
                    {{ row.value }}
                  </span>
                </DescriptionItem>
              </DescriptionListRoot>

              <DescriptionListRoot align="between" class="mt-4 gap-y-2">
                <DescriptionItem
                  v-for="row in totals"
                  :key="row.key"
                  :term="t(row.labelKey)"
                >
                  <span :data-test-key="`order-total-${row.key}`">
                    {{ row.value }}
                  </span>
                </DescriptionItem>
              </DescriptionListRoot>

              <div class="text-faint mt-4 flex flex-col gap-1 text-xs">
                <p
                  data-test-key="order-contract-id"
                  :data-test-value="context!.contractId.value"
                >
                  {{ context!.contractId.value }}
                </p>
                <p
                  data-test-key="order-data"
                  :data-test-value="context!.data.value.id"
                >
                  {{ context!.data.value.number }}
                </p>
              </div>
            </Section>

            <Section :label="t('labs.order_items')" icon="shopping-bag-02">
              <ul class="flex flex-col gap-3" data-test-key="order-products">
                <li
                  v-for="item in context!.products.value"
                  :key="item.id"
                  class="rounded-card flex flex-col gap-2 border border-current/10 p-3"
                  data-test-key="order-product"
                  :data-test-value="item.id"
                >
                  <div class="flex flex-wrap items-center gap-3">
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.name"
                      class="size-10 rounded-md object-cover"
                      data-test-key="order-product-image"
                    />
                    <div class="flex flex-1 flex-col">
                      <span class="font-medium">{{ item.name }}</span>
                      <span v-if="item.period" class="text-faint text-xs">
                        {{ item.period.from }} &ndash; {{ item.period.to }}
                      </span>
                      <span
                        v-if="item.billingCycle?.name"
                        class="text-faint text-xs"
                        data-test-key="order-product-billing-cycle"
                      >
                        {{ item.billingCycle.name }}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-sm">
                      <span v-if="item.quantity"
                        >&times;{{ item.quantity }}</span
                      >
                      <span v-if="item.price">{{ item.price }}</span>
                      <span v-if="item.total" class="font-medium">{{
                        item.total
                      }}</span>
                    </div>
                  </div>

                  <ul
                    v-if="item.hasSubItems"
                    class="text-faint flex flex-col gap-1 border-t border-current/10 pt-2 pl-4 text-xs"
                  >
                    <li
                      v-for="subItem in subItemsOf(item)"
                      :key="subItem.id"
                      class="flex items-center justify-between gap-3"
                    >
                      <span>{{ subItem.name }}</span>
                      <span class="flex items-center gap-3">
                        <span v-if="subItem.quantity > 1"
                          >&times;{{ subItem.quantity }}</span
                        >
                        <span>{{ subItem.total || subItem.price }}</span>
                      </span>
                    </li>
                  </ul>
                </li>
              </ul>
            </Section>
          </template>

          <OrderPayment v-if="meta!.canPay.value" :actions="actions!" />
        </section>
      </template>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useOrder/order.page
 * @description One client order, drawn directly — `/useOrder/:oid`
 * (design 8.12). The page holds ONE `useOrder().as(ScopeActorTypes.SELF)
 * .withId(oid)` instance for its whole life, with `oid` from the route param
 * only. It opens the order view on mount whenever an `oid` is present, through
 * the same enter path the button uses; each enter opens the view and calls
 * `refresh()` on that same instance (D-12, parity row 25), so a re-enter adds
 * exactly one single read. The view is modelled on the
 * invoice `OrderView`: a hero with the status badge, a summary section of
 * formatted fields, a styled item list with sub-items and a totals block.
 * Each published member carries its own `order-<member>` test key. The
 * payment component mounts only while `canPay` is true and calls `usePayment()`
 * in its own setup (design 6.4).
 */

import {
  Alert,
  Badge,
  Button,
  DescriptionItem,
  DescriptionListRoot,
  EmptyState,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  Spinner
} from "@upmind/ui";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ScopeActorTypes, useOrder } from "@upmind-automation/client-vue";
import { Hero, Icon, Section } from "@upmind-automation/foundation";
import OrderPayment from "./order.payment.vue";
import { concat, filter, isArray, isEmpty, map, toString } from "lodash-es";
import type { BadgeVariants } from "@upmind/ui";
import type { OrderItem } from "@upmind-automation/client-vue";

definePageMeta({
  key: route => route.path
});

const { t } = useI18n();
const route = useRoute();

const oid = computed(() => {
  const raw = route.params.oid;
  return (isArray(raw) ? raw[0] : raw) || undefined;
});

const manager = oid.value
  ? useOrder().as(ScopeActorTypes.SELF).withId(oid.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();
const meta = manager?.useMeta();

const isOpen = ref(false);
const actionError = ref<string>();

const readouts = computed(() => [
  {
    key: "order-error",
    label: "error",
    value: context?.error.value?.message ?? ""
  }
]);

const metaFlags = computed(() => {
  if (!meta) return [];
  return map(
    [
      ["order-is-due", meta.isDue],
      ["order-is-payable", meta.isPayable],
      ["order-is-cancellable", meta.isCancellable],
      ["order-is-overdue", meta.isOverdue],
      ["order-is-paid", meta.isPaid],
      ["order-is-cancelled", meta.isCancelled],
      ["order-is-partially-paid", meta.isPartiallyPaid],
      ["order-can-pay", meta.canPay],
      ["order-can-cancel", meta.canCancel],
      ["order-has-pending-payment", meta.hasPendingPayment],
      ["order-is-delegated", meta.isDelegated],
      ["order-has-online-gateways", meta.hasOnlineGateways],
      ["order-is-available", meta.isAvailable],
      ["order-is-complete", meta.isComplete],
      ["order-is-empty", meta.isEmpty],
      ["order-is-loading", meta.isLoading],
      ["order-is-processing", meta.isProcessing],
      ["order-has-error", meta.hasError]
    ] as const,
    ([key, flag]) => ({
      key,
      value: !!flag.value,
      label: key.replace("order-", "")
    })
  );
});

const statusName = computed(() => context?.detail.value.status?.name);

const statusVariant = computed<BadgeVariants["variant"]>(() => {
  if (meta?.isPaid.value) return "success";
  if (meta?.isCancelled.value) return "neutral";
  if (meta?.isOverdue.value) return "danger";
  if (meta?.isPartiallyPaid.value || meta?.isDue.value) return "warning";
  return "neutral";
});

const heroBadge = computed(() =>
  statusName.value
    ? { label: statusName.value, variant: statusVariant.value }
    : undefined
);

const summaryRows = computed(() => {
  const detail = context?.detail.value;
  if (!detail) return [];
  return filter(
    [
      {
        key: "number",
        labelKey: "labs.orders_col_number",
        value: detail.number
      },
      {
        key: "created",
        labelKey: "labs.orders_col_created",
        value: detail.createdAt
      },
      {
        key: "paid",
        labelKey: "labs.orders_col_paid",
        value: detail.paidDatetime
      },
      {
        key: "due",
        labelKey: "labs.orders_col_due",
        value: detail.dueDate
      },
      {
        key: "cancelled",
        labelKey: "labs.orders_col_cancelled",
        value: detail.cancellationDatetime
      },
      {
        key: "cancellation-reason",
        labelKey: "labs.order_cancellation_reason",
        value: detail.cancellationReason
      },
      {
        key: "notes",
        labelKey: "labs.order_notes",
        value: detail.notes
      },
      {
        key: "referrer",
        labelKey: "labs.order_referrer",
        value: detail.referrer?.fullname
      }
    ],
    row => !isEmpty(toString(row.value))
  );
});

const totals = computed(() => {
  const order = context?.data.value;
  if (!order) return [];
  return filter(
    [
      {
        key: "subtotal",
        labelKey: "labs.order_subtotal",
        value: order.net_amount_formatted,
        show: !isEmpty(toString(order.net_amount_formatted))
      },
      {
        key: "promotions",
        labelKey: "labs.order_promotions",
        value: order.total_discount_amount_formatted,
        show: !!order.total_discount_amount
      },
      {
        key: "taxes",
        labelKey: "labs.order_taxes",
        value: order.tax_amount_formatted,
        show: !!order.tax_amount
      },
      {
        key: "total",
        labelKey: "labs.orders_col_total",
        value: order.total_amount_formatted,
        show: !isEmpty(toString(order.total_amount_formatted))
      }
    ],
    row => row.show
  );
});

function subItemsOf(item: OrderItem) {
  return concat(item.quantifiableItems, item.nonQuantifiableItems);
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

function enter(): void {
  isOpen.value = true;
  void run(() => actions?.refresh());
}

onMounted(() => {
  if (manager) enter();
});

onUnmounted(() => actions?.destroy());
</script>
