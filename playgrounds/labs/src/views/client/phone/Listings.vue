<template>
  <UpmContentSection class="mx-auto max-w-app" title="Phones">
    <div class="flex gap-2 pb-6" v-show="meta.isAvailable">
      <Button
        @click="refresh"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading"
      >
        Refetch Phones
      </Button>

      <Button @click="doAdd" :loading="meta.isLoading">New Phone</Button>
    </div>

    <Alert
      v-if="!meta.isAvailable"
      color="error"
      title="Please log in to view phones"
    />

    <Alert v-else-if="meta.isLoading" color="info" title="Loading..." />

    <Alert
      v-else-if="meta.hasError"
      color="error"
      title="Error loading phones"
      :message="error?.message"
    />

    <Alert
      v-else-if="meta.isEmpty"
      color="info"
      title="No phones found"
      message="Please add an phone to get started."
    />

    <section v-else class="pb-3 md:pb-3" v-for="phone in data" :key="phone.id">
      <UpmCard>
        <h3 class="mt-0">{{ phone.title }}</h3>
        <p>{{ phone.description }}</p>

        <div class="flex gap-2">
          <Button @click="doEdit(phone.id)" size="sm" variant="tonal">
            <Icon icon="edit" class="size-4" />
          </Button>
          <Button
            @click="remove(phone.id)"
            size="sm"
            variant="tonal"
            label="Delete"
            :disabled="!phone.meta.canDelete"
          >
            <Icon icon="remove" class="size-4" />
          </Button>
          <Button
            @click="setDefault(phone.id)"
            size="sm"
            variant="tonal"
            label="Set Default"
            :disabled="phone.meta.isDefault"
          />
        </div>
      </UpmCard>
    </section>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal
import { useClientPhones } from "@upmind-automation/headless";

// --- components
import { Button, Alert, Icon } from "@upmind-automation/upmind-ui";
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { data, meta, error, remove, setDefault, refresh } = useClientPhones();

const router = useRouter();

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.phones.edit" });
}

function doAdd() {
  router.push({ name: "client.phones.add" });
}
</script>
