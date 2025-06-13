<template>
  <UpmContentSection class="mx-auto max-w-app" title="Companies">
    <div class="flex gap-2 pb-6" v-show="meta.isAvailable">
      <Button
        @click="refresh"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading"
      >
        Refetch Companies
      </Button>

      <Button @click="doAdd" :loading="meta.isLoading">New Company</Button>
    </div>

    <Alert
      v-if="!meta.isAvailable"
      color="error"
      title="Please log in to view companies"
    />

    <Alert v-else-if="meta.isLoading" color="info" title="Loading..." />

    <Alert
      v-else-if="meta.hasError"
      color="error"
      title="Error loading companies"
      :message="error?.message"
    />

    <Alert
      v-else-if="meta.isEmpty"
      color="info"
      title="No companies found"
      message="Please add a company to get started."
    />

    <section
      v-else
      class="pb-3 md:pb-3"
      v-for="company in data"
      :key="company.id"
    >
      <UpmCard>
        <h3 class="mt-0">{{ company.title }}</h3>
        <p>{{ company.description }}</p>

        <div class="flex gap-2">
          <Button @click="doEdit(company.id)" size="sm" variant="tonal">
            <Icon icon="edit" class="size-4" />
          </Button>
          <Button
            @click="remove(company.id)"
            size="sm"
            variant="tonal"
            label="Delete"
            :disabled="!company.meta.canDelete"
          >
            <Icon icon="remove" class="size-4" />
          </Button>
          <Button
            @click="setDefault(company.id)"
            size="sm"
            variant="tonal"
            label="Set Default"
            :disabled="company.meta.isDefault"
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
import { useClientCompanies } from "@upmind-automation/headless";

// --- components
import { Button, Alert, Icon } from "@upmind-automation/upmind-ui";
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { data, meta, error, remove, setDefault, refresh } = useClientCompanies();

const router = useRouter();

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.companies.edit" });
}

function doAdd() {
  router.push({ name: "client.companies.add" });
}
</script>
