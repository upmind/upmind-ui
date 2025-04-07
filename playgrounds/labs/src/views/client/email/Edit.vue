<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Email ${title}`"
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
  useClientEmail,
  useClientEmails,
  type EmailModel,
} from "@upmind-automation/client-vue";

const { isReady, getAll } = useClientEmails();
await isReady()
  .then(() => getAll())
  .catch(() => router.push({ name: "client.emails" }));

const router = useRouter();
const { params } = useRoute();
const { update, input, model, meta, title, schema, uischema, stop } =
  useClientEmail(params.id as string);

// --- METHODS

const doInput = debounce((data: EmailModel) => {
  input(data);
}, 500);

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.emails",
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.emails",
  });
}
</script>
