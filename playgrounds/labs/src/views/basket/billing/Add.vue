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
        @update:modelValue="doInput"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import {
  UpmCard,
  UpmForm,
  UpmContentSection,
} from "@upmind-automation/client-vue";
import { debounce } from "lodash-es";

import {
  useClientAddress,
  type UnifiedAddressModel,
} from "@upmind-automation/headless-vue";

const router = useRouter();
const { update, input, model, meta, schema, uischema, stop } =
  useClientAddress();

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
