<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Address"
  >
    <Card class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ meta }}</pre>

      <UpmForm
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="data => input(data as AddressModel)"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </Card>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import {
  UpmForm,
  UpmContentSection,
  useClientAddress,
  useClientAddresses,
  type AddressModel
} from "@upmind-automation/client-vue";
import { useRouter } from "vue-router";
import { Card } from "@upmind-automation/upmind-ui";

const { isReady } = useClientAddresses();
await isReady().catch(() => router.push({ name: "client.addresses" }));

const router = useRouter();
const { update, input, model, meta, schema, uischema, stop } =
  useClientAddress();

// --- METHODS

function doUpdate() {
  update().then(() => {
    router.push({
      name: "client.addresses"
    });
  });
}

function doCancel() {
  stop();
  router.push({
    name: "client.addresses"
  });
}
</script>
