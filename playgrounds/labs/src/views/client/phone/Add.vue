<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Phone"
  >
    <Card class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as PhoneModel)"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </Card>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es";
import { useRouter } from "vue-router";
import { UpmContentSection } from "@upmind-automation/client-vue";
import { Card } from "@upmind-automation/upmind-ui";

import {
  UpmForm,
  useClientPhone,
  useClientPhones,
  type PhoneModel
} from "@upmind-automation/client-vue";

const { isReady } = useClientPhones();
await isReady().catch(() => router.push({ name: "client.phones" }));

const router = useRouter();
const { update, input, model, meta, schema, uischema, stop } = useClientPhone();

// --- METHODS

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.phones"
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.phones"
  });
}
</script>
