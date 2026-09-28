<template>
  <Card size="sm" class="gap-3" data-test-key="client-order-use-payment">
    <div class="flex flex-wrap gap-2">
      <Badge
        v-for="flag in engineFlags"
        :key="flag.key"
        size="sm"
        :appearance="flag.value ? 'solid' : 'muted'"
        :data-test-key="flag.key"
        :data-test-value="String(flag.value)"
      >
        {{ flag.label }}
      </Badge>
    </div>
    <div class="flex flex-wrap gap-3">
      <Button
        :disabled="!!payment.meta.value.isProcessing"
        :data-attrs="{ 'data-test-key': 'client-order-use-payment-pay' }"
        @click="payment.pay()"
      >
        {{ t("labs.client_order_pay") }}
      </Button>
      <Button
        variant="ghost"
        :data-attrs="{ 'data-test-key': 'client-order-use-payment-retry' }"
        @click="payment.retry()"
      >
        {{ t("labs.client_order_retry") }}
      </Button>
    </div>
  </Card>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useClientOrder/client-order.payment
 * @description The order's payment component (design 6.4). It calls
 * `usePayment()` inside its OWN setup, so the pay engine's lifecycle binds
 * to this component, and the page mounts it only while `canPay` is true.
 */

import { Badge, Button, Card } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { map, toPairs } from "lodash-es";
import type { ClientOrderPaymentProps } from "./client-order.types";

const props = defineProps<ClientOrderPaymentProps>();

const { t } = useI18n();

const payment = props.actions.usePayment();

const engineFlags = computed(() =>
  map(toPairs(payment.meta.value), ([key, value]) => ({
    key: `client-order-use-payment-meta-${key}`,
    value: !!value,
    label: key
  }))
);
</script>
