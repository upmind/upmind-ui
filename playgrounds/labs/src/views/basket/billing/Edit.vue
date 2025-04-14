<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Billing Detail ${title}`"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="doInput"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";
import { debounce } from "lodash-es";

import {
  UpmForm,
  useBasketBillingDetail,
  type UnifiedAddressModel,
} from "@upmind-automation/headless-vue";

const { isReady, getAll } = useBasketBillingDetail();
await isReady()
  .then(() => getAll())
  .catch(() => router.push({ name: "basket.billing" }));

const router = useRouter();
const { params } = useRoute();
const { update, input, model, meta, title, schema, uischema, stop } =
  useBasketBillingDetail(params.id as string);

// --- METHODS

const doInput = debounce((data: UnifiedAddressModel) => {
  input(data);
}, 500);

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
