<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Address ${title}`"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as AddressModel)"
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

import {
  UpmForm,
  useClientAddress,
  useClientAddresses,
  type AddressModel,
} from "@upmind-automation/client-vue";

const router = useRouter();

// NB: (re)fetch all addresses and wait before rendering the page
// as useClientAddress depends on the id being in the list
// TODO: MAYBE do a direct call to the db for the address instead of fetching all
const { isReady } = useClientAddresses();
await isReady()
  .then(value => {
    if (!value) {
      router.push({ name: "client.addresses" });
    }
  })
  .catch(() => router.push({ name: "client.addresses" }));

const { params } = useRoute();
const { update, input, model, meta, title, schema, uischema, stop } =
  useClientAddress(params.id as string);

// --- METHODS

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.addresses",
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.addresses",
  });
}
</script>
