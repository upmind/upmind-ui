<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <div class="flex gap-2 pb-6">
      <Button
        @click="fetchAddresses"
        size="sm"
        variant="tonal"
        label="Load addresses"
        :disabled="isLoadingAddresses || addresses.length > 0"
      >
        Load addresses
      </Button>
      <Button
        @click="invalidateAddresses"
        size="sm"
        variant="tonal"
        label="Invalidate addresses"
      >
        Invalidate addresses
      </Button>
      <Button
        @click="clearAddresses"
        size="sm"
        variant="tonal"
        label="Clear addresses"
      >
        Clear addresses
      </Button>
      <Button @click="generateNewAddress">New Address</Button>
    </div>

    <section
      class="pb-3 md:pb-3"
      v-for="address in addresses"
      :key="address.id"
    >
      <div v-if="isLoadingAddresses">Loading...</div>
      <UpmCard v-else>
        <h3 class="mt-0">{{ address.title }}</h3>
        <p>{{ address.description }}</p>

        <Button
          @click="doEdit(address.id)"
          class="mt-2"
          size="sm"
          variant="tonal"
          label="Edit"
        >
          Edit
        </Button>
      </UpmCard>
    </section>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
import { faker } from "@faker-js/faker";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";

// --- internal

// --- components
import {
  UpmCard,
  useQuery,
  UpmContentSection,
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";
import {
  Address,
  AddressTypes,
  useClientAddress,
  useClientAddresses,
  useSession,
} from "@upmind-automation/headless";

const { getAll } = useClientAddresses();
const { queryClient } = useQuery();

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

const addresses = ref<Address[]>([]);
const isLoadingAddresses = ref<boolean>(false);

function clearAddresses() {
  addresses.value = [];
}

function fetchAddresses() {
  addresses.value = [];
  isLoadingAddresses.value = true;
  getAll()
    .then(res => (addresses.value = res))
    .finally(() => (isLoadingAddresses.value = false));
}

function invalidateAddresses() {
  return queryClient.invalidateQueries({
    queryKey: ["client", "addresses"],
  });
}

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.addresses.edit" });
}

function generateNewAddress() {
  const address = useClientAddress();

  const model = {
    address1: faker.location.streetAddress({ useFullAddress: true }),
    address2: faker.location.buildingNumber(),
    city: faker.location.city(),
    countryId: "US",
    name: faker.location.street(),
    postcode: faker.location.zipCode(),
    state: faker.location.state(),
    type: 1,
  };

  console.log(model);

  address
    .isReady()
    .then(() => address.input(model).then(() => address.update()));
}

onMounted(() => {
  fetchAddresses();
});
</script>
