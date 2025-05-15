<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Billing Detail"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as UnifiedAddressModel)"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import {
  UpmForm,
  UpmCard,
  UpmContentSection,
  useBasketBillingDetail,
  useBasketBillingDetails,
  type UnifiedAddressModel,
} from "@upmind-automation/client-vue";
import { useRouter } from "vue-router";

const { isReady } = useBasketBillingDetails();
await isReady().catch(() => router.push({ name: "basket.billing" }));

const router = useRouter();
const { update, input, model, meta, schema, uischema, stop } =
  useBasketBillingDetail();

// --- METHODS

function doUpdate() {
  update().then(() => {
    router.push({
      name: "basket.billing",
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "basket.billing",
  });
}
</script>
