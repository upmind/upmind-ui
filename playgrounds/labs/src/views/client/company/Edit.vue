<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Company ${title}`"
  >
    <Card class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as CompanyModel)"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </Card>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { UpmContentSection } from "@upmind-automation/client-vue";
import { Card } from "@upmind-automation/upmind-ui";
import { debounce } from "lodash-es";

import {
  UpmForm,
  useClientCompany,
  useClientCompanies,
  type CompanyModel
} from "@upmind-automation/client-vue";

const { isReady, getAll } = useClientCompanies();
await isReady()
  .then(() => getAll())
  .catch(() => router.push({ name: "client.addresses" }));

const router = useRouter();
const { params } = useRoute();
const { update, input, model, meta, title, schema, uischema, stop } =
  useClientCompany(params.id as string);

// --- METHODS

const doInput = debounce((data: CompanyModel) => {
  input(data);
}, 500);

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.companies"
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.companies"
  });
}
</script>
