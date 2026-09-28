<template>
  <Page :data-attrs="{ 'data-test-key': 'client-order-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.client_order_title") }}</PageTitle>
      <PageDescription>{{
        t("labs.client_order_description")
      }}</PageDescription>
    </PageHeader>

    <PageBody class="gap-6">
      <EmptyState
        v-if="!manager"
        :title="t('labs.client_order_needs_id')"
        :data-attrs="{ 'data-test-key': 'client-order-needs-id' }"
      >
        <template #icon><Icon icon="receipt" /></template>
      </EmptyState>

      <template v-else>
        <div class="flex flex-wrap gap-3">
          <Button
            v-if="!isOpen"
            :data-attrs="{ 'data-test-key': 'client-order-enter' }"
            @click="enter"
          >
            {{ t("labs.client_order_enter") }}
          </Button>
          <Button
            v-else
            variant="ghost"
            :data-attrs="{ 'data-test-key': 'client-order-leave' }"
            @click="isOpen = false"
          >
            {{ t("action.close") }}
          </Button>
        </div>

        <section
          v-if="isOpen"
          class="flex flex-col gap-4"
          data-test-key="client-order-view"
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
            :data-attrs="{ 'data-test-key': 'client-order-error' }"
          />

          <Card v-if="context!.data.value" size="sm" class="gap-3">
            <dl
              class="grid grid-cols-2 gap-3 text-sm"
              data-test-key="client-order-detail"
            >
              <template
                v-for="(value, field) in context!.detail.value"
                :key="field"
              >
                <dt class="text-faint">{{ field }}</dt>
                <dd :data-test-key="`client-order-detail-${kebabCase(field)}`">
                  {{ display(value) }}
                </dd>
              </template>
            </dl>
            <p
              data-test-key="client-order-contract-id"
              :data-test-value="context!.contractId.value"
            >
              {{ context!.contractId.value }}
            </p>
            <p
              data-test-key="client-order-data"
              :data-test-value="context!.data.value.id"
            >
              {{ context!.data.value.number }}
            </p>
          </Card>

          <ul class="flex flex-col gap-2" data-test-key="client-order-products">
            <li
              v-for="item in context!.products.value"
              :key="item.id"
              class="flex flex-wrap items-center gap-3"
              data-test-key="client-order-product"
              :data-test-value="item.id"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="size-8"
                data-test-key="client-order-product-image"
              />
              <span>{{ item.name }}</span>
              <span data-test-key="client-order-product-billing-cycle">
                {{ item.billingCycle?.name }}
              </span>
              <span>{{ item.total }}</span>
            </li>
          </ul>

          <div class="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              :data-attrs="{ 'data-test-key': 'client-order-refresh' }"
              @click="run(() => actions!.refresh())"
            >
              {{ t("action.refresh") }}
            </Button>
            <Button
              variant="ghost"
              :data-attrs="{ 'data-test-key': 'client-order-invalidate' }"
              @click="run(() => actions!.invalidate())"
            >
              {{ t("labs.client_orders_invalidate") }}
            </Button>
            <Button
              variant="outline"
              :disabled="meta!.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'client-order-cancel' }"
              @click="run(() => actions!.cancel())"
            >
              {{ t("action.cancel") }}
            </Button>
          </div>

          <ClientOrderPayment v-if="meta!.canPay.value" :actions="actions!" />
        </section>
      </template>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useClientOrder/client-order.page
 * @description One client order, drawn directly — `/useClientOrder/:oid`
 * (design 8.12). The page holds ONE `useClientOrder().as(ScopeActorTypes.SELF)
 * .withId(oid)` instance for its whole life, with `oid` from the route param
 * only. It mounts with the order view closed; each enter opens the view and
 * calls `refresh()` on that same instance (D-12, parity row 25), so the
 * second enter adds exactly one single read. Each published member carries
 * its own `client-order-<member>` test key. The payment component mounts
 * only while `canPay` is true and calls `usePayment()` in its own setup
 * (design 6.4).
 *
 * NOT drawn, and named rather than faked: `isReady`/`destroy` are lifecycle,
 * and `reset` is `@scenario-exclude`.
 */

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
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
  Icon,
  ScopeActorTypes,
  useClientOrder
} from "@upmind-automation/client-vue";
import ClientOrderPayment from "./client-order.payment.vue";
import { isArray, isNil, isObject, kebabCase, map } from "lodash-es";

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
  ? useClientOrder().as(ScopeActorTypes.SELF).withId(oid.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();
const meta = manager?.useMeta();

const isOpen = ref(false);
const actionError = ref<string>();

const metaFlags = computed(() => {
  if (!meta) return [];
  return map(
    [
      ["client-order-is-due", meta.isDue],
      ["client-order-is-payable", meta.isPayable],
      ["client-order-is-cancellable", meta.isCancellable],
      ["client-order-is-overdue", meta.isOverdue],
      ["client-order-is-paid", meta.isPaid],
      ["client-order-is-cancelled", meta.isCancelled],
      ["client-order-is-partially-paid", meta.isPartiallyPaid],
      ["client-order-can-pay", meta.canPay],
      ["client-order-can-cancel", meta.canCancel],
      ["client-order-has-pending-payment", meta.hasPendingPayment],
      ["client-order-is-delegated", meta.isDelegated],
      ["client-order-has-online-gateways", meta.hasOnlineGateways],
      ["client-order-is-available", meta.isAvailable],
      ["client-order-is-complete", meta.isComplete],
      ["client-order-is-empty", meta.isEmpty],
      ["client-order-is-loading", meta.isLoading],
      ["client-order-is-processing", meta.isProcessing],
      ["client-order-has-error", meta.hasError]
    ] as const,
    ([key, flag]) => ({
      key,
      value: !!flag.value,
      label: key.replace("client-order-", "")
    })
  );
});

function display(value: unknown): string {
  if (isNil(value)) return "";
  return isObject(value) ? JSON.stringify(value) : String(value);
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

onUnmounted(() => actions?.destroy());
</script>
