<template>
  <UpmContentSection class="mx-auto max-w-app" title="Billing Details">
    <div class="flex gap-2 pb-6">
      <Button
        @click="getAll"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading || !meta.isAvailable"
      >
        Load
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
        New Billing Detail
      </Button>
    </div>

    <Alert
      v-if="!meta.isAvailable"
      color="error"
      title="Please log in to view billing details"
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
      title="No billing details found"
      message="Please add a billing detail to get started."
    />

    <section
      v-else
      class="pb-3 md:pb-3"
      v-for="billingDetail in data"
      :key="billingDetail.id"
    >
      <UpmCard>
        <h3 class="mt-0">{{ billingDetail.title }}</h3>
        <p>{{ billingDetail.description }}</p>

        <div class="flex gap-2">
          <Button @click="doEdit(billingDetail.id)" size="sm" variant="tonal">
            <Icon icon="edit" class="size-4" />
          </Button>
          <Button
            @click="remove(billingDetail.id)"
            size="sm"
            variant="tonal"
            label="Delete"
            :disabled="!billingDetail.meta.canDelete"
          >
            <Icon icon="remove" class="size-4" />
          </Button>
          <Button
            @click="setDefault(billingDetail.id)"
            size="sm"
            variant="tonal"
            label="Set Default"
            :disabled="billingDetail.meta.isDefault"
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
import {
  UpmCard,
  UpmContentSection,
  useBasketBillingDetails,
} from "@upmind-automation/client-vue";

// --- components
import { Button, Alert, Icon } from "@upmind-automation/upmind-ui";

const { isReady, getAll, data, meta, error, invalidate, remove, setDefault } =
  useBasketBillingDetails();

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "basket.billing.edit" });
}

function doAdd() {
  router.push({ name: "basket.billing.add" });
}

await isReady().then(() => getAll());
</script>
