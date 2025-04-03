<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <div class="flex gap-2 pb-6">
      <Button
        @click="getAll"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading || !meta.isAvailable"
      >
        Load addresses
      </Button>
      <Button
        @click="invalidate"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading || !meta.isAvailable"
      >
        Invalidate
      </Button>

      <Button
        @click="doAdd"
        :loading="meta.isLoading"
        :disabled="!meta.isAvailable"
      >
        New Address
      </Button>
    </div>

    <Alert
      v-if="!meta.isAvailable"
      color="error"
      title="Please log in to view addresses"
    />

    <Alert v-else-if="meta.isLoading" color="info" title="Loading..." />

    <Alert
      v-else-if="meta.isError"
      color="error"
      :title="error.title"
      :message="error.message"
    />

    <Alert
      v-else-if="meta.isEmpty"
      color="info"
      title="No addresses found"
      message="Please add an address to get started."
    />

    <section
      v-else
      class="pb-3 md:pb-3"
      v-for="address in data"
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

// --- internal
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";
import { Button, Alert } from "@upmind-automation/upmind-ui";

const { isReady, getAll, data, meta, error, invalidate, remove, setDefault } =
  useClientAddresses();

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.addresses.edit" });
}

function doAdd() {
  router.push({ name: "client.addresses.add" });
}

await isReady().then(() => getAll());
</script>
