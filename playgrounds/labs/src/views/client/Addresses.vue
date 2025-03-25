<template>
  <UpmContentSection class="mx-auto max-w-app" class-content="gap-2 flex">
    <Button
      type="reset"
      class="relative -top-4 md:-top-6"
      size="sm"
      variant="tonal"
      label="Addresses"
      @click.prevent="router.push({ name: 'client.addresses' })"
      disabled
    >
    </Button>
    <Button
      type="reset"
      class="relative -top-4 md:-top-6"
      size="sm"
      variant="tonal"
      label="Emails"
      @click.prevent="router.push({ name: 'client.emails' })"
    >
    </Button>
    <Button
      type="reset"
      class="relative -top-4 md:-top-6"
      size="sm"
      variant="tonal"
      label="Phones"
      @click.prevent="router.push({ name: 'client.phones' })"
    >
    </Button>
  </UpmContentSection>

  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <UpmCard class="flex gap-2 pb-3 md:pb-3">
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
    </UpmCard>

    <UpmCard class="pb-3 md:pb-3">
      <div v-if="isLoadingAddresses">Loading...</div>
      <div v-else>
        <div v-for="address in addresses" :key="address.id">
          <div>{{ address.address1 }}</div>
          <div>{{ address.address2 }}</div>
          <div>{{ address.city }}</div>
          <div>{{ address.state }}</div>
          <Button
            @click="doEdit(address.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Edit"
          >
            Edit
          </Button>
        </div>
      </div>
    </UpmCard>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";
import { useRouter } from "vue-router";

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
  useClientAddress,
  useClientAddresses,
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
  const { update } = useClientAddress(id);

  update();

  // router.push({ params: { id } });
}
</script>
