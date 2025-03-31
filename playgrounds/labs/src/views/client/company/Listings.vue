<template>
  <UpmContentSection class="mx-auto max-w-app" title="Companies">
    <div class="flex gap-2 pb-6">
      <Button
        @click="fetchCompanies"
        size="sm"
        variant="tonal"
        label="Load companies"
        :disabled="processing || companies.length > 0"
      >
        Load companies
      </Button>
      <Button
        @click="invalidateCompanies"
        size="sm"
        variant="tonal"
        label="Invalidate companies"
        :disabled="processing"
      >
        Invalidate companies
      </Button>
      <Button
        @click="clearCompanies"
        size="sm"
        variant="tonal"
        label="Clear companies"
        :disabled="processing"
      >
        Clear companies
      </Button>

      <Button @click="doAdd" :loading="processing">New Company</Button>
    </div>

    <div v-if="processing">Loading...</div>

    <section
      class="pb-3 md:pb-3"
      v-for="company in companies"
      :key="company.id"
    >
      <UpmCard>
        <h3 class="mt-0">{{ company.title }}</h3>
        <p>{{ company.description }}</p>

        <div class="flex gap-2">
          <Button
            @click="doEdit(company.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Edit"
          >
            Edit
          </Button>
          <Button
            @click="doDelete(company.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Delete"
            :disabled="!company.meta.canDelete"
          >
            Delete
          </Button>
          <Button
            @click="setDefault(company.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Set Default"
            :disabled="company.meta.isDefault"
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
import {
  Company,
  useClientCompanies,
  useQuery,
} from "@upmind-automation/headless";
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

const { getAll } = useClientCompanies();
const { queryClient } = useQuery();

// -----------------------------------------------------------------------------

const router = useRouter();

const companies = ref<Company[]>([]);
const processing = ref<boolean>(false);

function clearCompanies() {
  companies.value = [];
}

function fetchCompanies() {
  companies.value = [];
  processing.value = true;
  getAll()
    .then(res => (companies.value = res))
    .finally(() => (processing.value = false));
}

function invalidateCompanies() {
  return queryClient.invalidateQueries({
    queryKey: ["client", "companies"],
  });
}

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.companies.edit" });
}

function doAdd() {
  router.push({ name: "client.companies.add" });
}

function doDelete(id: string) {
  const { remove } = useClientCompanies();
  remove(id).then(() => fetchCompanies());
}

function setDefault(id: string) {
  const { setDefault } = useClientCompanies();
  setDefault(id).then(() => fetchCompanies());
}

onMounted(() => {
  fetchCompanies();
});
</script>
