<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Phone ${title}`"
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
import { debounce } from "lodash-es";
import { useRoute, useRouter } from "vue-router";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

import {
  UpmForm,
  useClientPhone,
  useClientPhones,
  type PhoneModel,
} from "@upmind-automation/client-vue";

const { isReady, getAll } = useClientPhones();
await isReady()
  .then(() => getAll())
  .catch(() => router.push({ name: "client.phones" }));

const router = useRouter();
const { params } = useRoute();
const { update, input, model, meta, title, schema, uischema, stop } =
  useClientPhone(params.id as string);

// --- METHODS

const doInput = debounce((data: PhoneModel) => {
  input(data);
}, 500);

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.phones",
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.phones",
  });
}
</script>
