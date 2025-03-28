<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Address"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ model }}</pre>

      <div class="actions flex w-full basis-full gap-2">
        <Button @click="doInput" variant="tonal" :disabled="processing"
          >Input Data</Button
        >
        <Button @click="doUpdate" :loading="processing">Update</Button>
      </div>
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { faker } from "@faker-js/faker";
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

const { update, input, getModel } = useClientAddress();
const processing = ref<boolean>(false);
const model = ref<AddressModel>(getModel() ?? {});

// --- METHODS

function doInput() {
  processing.value = true;

  const data = {
    address1: faker.location.streetAddress({ useFullAddress: true }),
    address2: faker.location.buildingNumber(),
    city: faker.location.city(),
    countryId: faker.location.countryCode(),
    name: faker.location.street(),
    postcode: faker.location.zipCode(),
    state: faker.location.state(),
    type: 1,
  };

  console.log(model);

  input(data)
    .then(data => {
      model.value = data;
    })
    .catch(err => {
      console.error("error inputting", { model, err });
    })
    .finally(() => {
      processing.value = false;
    });
}

function doUpdate() {
  processing.value = true;
  update()
    .then(() => {
      model.value = getModel();
    })
    .catch(err => {
      console.error("error adding", { model, err });
    })
    .finally(() => (processing.value = false));
}
</script>
