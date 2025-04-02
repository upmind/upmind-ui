<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <pre>{{ meta }}</pre>

    <div class="flex gap-2 pb-6">
      <Button
        @click="getAll"
        size="sm"
        variant="tonal"
        :disabled="!meta.isLoading"
      >
        Load addresses
      </Button>
      <Button
        @click="invalidateAddresses"
        size="sm"
        variant="tonal"
        :disabled="!meta.isLoading"
      >
        Invalidate
      </Button>

      <Button @click="doAdd" :loading="meta.isLoading">New Address</Button>
    </div>

    <div v-if="meta.isLoading">Loading...</div>

    <section class="pb-3 md:pb-3" v-for="address in data" :key="address.id">
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
            @click="remove(address.id)"
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
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

const { getAll, data, meta, error, invalidate, remove, setDefault } =
  useClientAddresses();

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

function invalidateAddresses() {
  return invalidate();
}

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.addresses.edit" });
}

function doAdd() {
  router.push({ name: "client.addresses.add" });
}

onMounted(() => {
  getAll();
});
</script>
