<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <div class="flex gap-2 pb-6">
      <Button
        @click="fetchAddresses"
        size="sm"
        variant="tonal"
        label="Load addresses"
        :disabled="processing || addresses.length > 0"
      >
        Load addresses
      </Button>
      <Button
        @click="invalidateAddresses"
        size="sm"
        variant="tonal"
        label="Invalidate addresses"
        :disabled="processing"
      >
        Invalidate addresses
      </Button>
      <Button
        @click="clearAddresses"
        size="sm"
        variant="tonal"
        label="Clear addresses"
        :disabled="processing"
      >
        Clear addresses
      </Button>

      <Button @click="doAdd" :loading="processing">New Address</Button>
    </div>

    <div v-if="processing">Loading...</div>

    <section
      class="pb-3 md:pb-3"
      v-for="address in addresses"
      :key="address.id"
    >
      <UpmCard>
        <h3 class="mt-0">{{ address.title }}</h3>
        <p>{{ address.description }}</p>

        <div class="flex gap-2">
          <Button
            @click="doEdit(address.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Edit"
          >
            Edit
          </Button>
          <Button
            @click="doDelete(address.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Delete"
            :disabled="!address.meta.canDelete"
          >
            Delete
          </Button>
          <Button
            @click="setDefault(address.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Set Default"
            :disabled="address.meta.isDefault"
            >Set Default</Button
          >
        </div>
      </UpmCard>
    </section>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
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
import { Address, useClientAddresses } from "@upmind-automation/headless";

const { getAll } = useClientAddresses();
const { queryClient } = useQuery();

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

const addresses = ref<Address[]>([]);
const processing = ref<boolean>(false);

function clearAddresses() {
  addresses.value = [];
}

function fetchAddresses() {
  addresses.value = [];
  processing.value = true;
  getAll()
    .then(res => (addresses.value = res))
    .finally(() => (processing.value = false));
}

function invalidateAddresses() {
  return queryClient.invalidateQueries({
    queryKey: ["client", "addresses"],
  });
}

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.addresses.edit" });
}

function doAdd() {
  router.push({ name: "client.addresses.add" });
}

function doDelete(id: string) {
  const { remove } = useClientAddresses();
  remove(id).then(() => fetchAddresses());
}

function setDefault(id: string) {
  const { setDefault } = useClientAddresses();
  setDefault(id).then(() => fetchAddresses());
}

onMounted(() => {
  fetchAddresses();
});
</script>
