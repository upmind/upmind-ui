<template>
  <UpmLayout>
    <!-- Error alert (only after submission) -->
    <Alert
      v-if="submitted && meta.hasErrors"
      color="danger"
      variant="minimal"
      icon="alert-triangle"
      title="Something went wrong"
      :description="
        errors?.message || 'Failed to add payment method. Please try again.'
      "
    />

    <!-- ADD form -->
    <UpmPaymentDetails
      v-if="!meta.isComplete"
      @resolve="onComplete"
      label="Payment Detail Add"
      icon="credit-card-plus"
    />

    <!-- Success interstitial -->
    <Interstitial
      v-if="meta.isComplete"
      title="Payment method added"
      text="Your payment method has been stored successfully."
      :animated-icon="{
        icon: 'card',
        trigger: 'loop',
        primaryColor: 'base-foreground',
        secondaryColor: 'tertiary',
        size: '4xl'
      }"
      :actions="[{ label: 'Add another', handler: () => router.go(0) }]"
    />

    <!-- Stored Payment Methods -->
    <UpmSection label="Stored Payment Methods" icon="wallet-01">
      <div v-if="!storedPaymentMethods?.length" class="text-muted text-sm">
        No stored payment methods yet.
      </div>

      <div v-else class="mt-5 grid gap-3">
        <div
          v-for="pm in storedPaymentMethods"
          :key="pm.id"
          class="border-border bg-surface-raised flex items-center gap-3 rounded-lg border p-3"
        >
          <div class="flex-1">
            <div class="text-sm font-medium">{{ pm.name || pm.title }}</div>
            <div class="text-muted text-xs">
              <span v-if="pm.cardType">{{ pm.cardType }}</span>
              <span v-if="pm.cardLast4"> •••• {{ pm.cardLast4 }}</span>
              <span v-if="pm.cardExpireDate">
                · Exp {{ pm.cardExpireDate }}</span
              >
            </div>
          </div>
          <div class="text-muted text-xs">
            {{ pm.currency?.code }}
          </div>
        </div>
      </div>
    </UpmSection>
  </UpmLayout>
</template>

<script lang="ts" setup>
// --- external
import { computed, provide, ref, watch } from "vue";
import { useRouter } from "vue-router";

// --- internal
import {
  useBasketCurrency,
  usePaymentDetailAdd,
  usePaymentDetails
} from "@upmind-automation/client-vue";

// --- components
import {
  UpmLayout,
  UpmPaymentDetails,
  UpmSection
} from "@upmind-automation/client-vue";
import { Alert, Interstitial } from "@upmind-automation/upmind-ui";

// --- types
import type { UsePaymentDetailAdd } from "@upmind-automation/client-vue";
import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
const router = useRouter();
const { currency, isReady } = useBasketCurrency();
await isReady();

const instance = usePaymentDetailAdd({
  currency: currency.value as ICurrency
});

// Bridge the ADD composable into UpmPaymentDetailsAdd via inject.
provide("usePaymentDetail", instance as UsePaymentDetailAdd);

const { errors, meta } = instance;
const { data: storedPaymentMethods, refresh } = usePaymentDetails();
const submitted = ref(false);

// --- typed accessor (single narrowing point)

// --- debug
const debugState = computed(() => ({
  meta: instance.meta.value,
  gatewaysCount: instance.gateways.value?.length ?? 0,
  storedPaymentMethodsCount: storedPaymentMethods.value?.length ?? 0,
  state: instance?.state?.value
}));

async function onComplete() {
  submitted.value = true;
  instance.add().then(() => refresh());
}

watch(currency, currency => {
  instance.refresh(currency as ICurrency);
});
</script>
