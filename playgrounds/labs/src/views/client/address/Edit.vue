<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="model.title"
    :description="model.description"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ model }}</pre>

      <div class="actions flex w-full basis-full gap-2">
        <Button @click="doInput" variant="outline" color="primary"
          >Change to random name</Button
        >
        <Button @click="doUpdate" color="primary">Update</Button>
      </div>
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { Button } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";
import {
  useClientAddress,
  useClientAddresses,
  type Address,
} from "@upmind-automation/headless";

// NB: (re)fetch all addresses and wait before rendering the page
// as useClientAddress depends on the id being in the list
// TODO: MAYBE do a direct call to the db for the address instead of fetching all
const { isReady, getAll } = useClientAddresses();
await getAll().then(isReady);

const { params } = useRoute();
const { update, input, getModel } = useClientAddress(params.id as string);

const model = ref<Address>(getModel() ?? {});

// --- METHODS

function doInput() {
  input({
    ...model.value,
    name: `New name ${Math.random()}`,
  })?.then((data: Address) => {
    model.value = data;
  });
}

function doUpdate() {
  // TODO: checkthe actual update service
  update().then(res => {
    model.value = getModel();
  });
}
</script>
