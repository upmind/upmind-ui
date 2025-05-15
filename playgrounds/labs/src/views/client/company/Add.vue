<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Address"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as CompanyModel)"
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
  useClientCompany,
  useClientCompanies,
  type CompanyModel,
} from "@upmind-automation/client-vue";

const { isReady } = useClientCompanies();
await isReady().catch(() => router.push({ name: "client.companies" }));

const router = useRouter();
const { update, input, model, meta, schema, uischema, stop } =
  useClientCompany();

// --- METHODS

const doInput = debounce((data: CompanyModel) => {
  input(data);
}, 500);

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.companies",
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.companies",
  });
}
</script>
