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
        @update:modelValue="doInput"
        @resolve="doUpdate"
        @reject="doCancel"
      />
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { faker } from "@faker-js/faker";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";
import { debounce } from "lodash-es";

import {
  UpmForm,
  useClientAddress,
  useClientAddresses,
  type AddressModel,
} from "@upmind-automation/client-vue";

// NB: (re)fetch all addresses and wait before rendering the page
// as useClientAddress depends on the id being in the list
// TODO: MAYBE do a direct call to the db for the address instead of fetching all
const { isReady, getAll } = useClientAddresses();
await isReady()
  // .then(() => {
  //   const data: AddressModel = {
  //     address1: faker.location.streetAddress({ useFullAddress: true }),
  //     address2: faker.location.buildingNumber(),
  //     city: faker.location.city(),
  //     countryId: faker.location.countryCode(),
  //     name: faker.location.street(),
  //     postcode: faker.location.zipCode(),
  //     state: faker.location.state(),
  //     type: 1,
  //   };
  //   input(data);
  // })
  .catch(() => router.push({ name: "client.addresses" }));

const router = useRouter();
const { update, input, model, meta, clear, title, schema, uischema, stop } =
  useClientAddress();

// --- METHODS

const doInput = debounce((data: AddressModel) => {
  input(data);
}, 500);

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
