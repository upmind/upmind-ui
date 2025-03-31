<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Address ${id}`"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ model }}</pre>

      <div class="actions flex w-full basis-full gap-2">
        <Button @click="doInput" variant="tonal" :disabled="processing"
          >Change to random name</Button
        >
        <Button @click="doUpdate" :loading="processing">Update</Button>
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
  type AddressModel,
} from "@upmind-automation/headless";

// NB: (re)fetch all addresses and wait before rendering the page
// as useClientAddress depends on the id being in the list
// TODO: MAYBE do a direct call to the db for the address instead of fetching all
const { isReady, getAll } = useClientAddresses();
await getAll().then(isReady);

const { params } = useRoute();
const { update, input, getModel } = useClientAddress(params.id as string);

const id = ref<string>(params.id as string);
const model = ref<AddressModel>(getModel() ?? {});
const processing = ref<boolean>(false);

// --- METHODS

function doInput() {
  processing.value = true;
  input({
    ...model.value,
    name: `New name ${Math.random()}`,
  })
    .then((data: AddressModel) => {
      model.value = data;
    })
    .catch(err => {
      console.error("error updating", { model, err });
    })
    .finally(() => {
      processing.value = false;
    });
}

function doUpdate() {
  processing.value = true;
  update()
    .then(res => {
      model.value = getModel();
    })
    .catch(err => {
      console.error("error updating", { model, err });
    })
    .finally(() => {
      processing.value = false;
    });
}
</script>
