<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Email"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as EmailModel)"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";
import { debounce } from "lodash-es";

import {
  UpmForm,
  useClientEmail,
  useClientEmails,
  type EmailModel,
} from "@upmind-automation/client-vue";

const { isReady } = useClientEmails();
await isReady().catch(() => router.push({ name: "client.emails" }));

const router = useRouter();
const { update, input, model, meta, schema, uischema, stop } = useClientEmail();

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
