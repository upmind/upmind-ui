<template>
  <UpmContentSection class="mx-auto max-w-app" title="Companies">
    <div class="flex gap-2 pb-6">
      <Button
        @click="fetchCompanies"
        size="sm"
        variant="tonal"
        label="Load companies"
        :disabled="processing || companies.length > 0"
      />
      <Button
        @click="invalidateCompanies"
        size="sm"
        variant="tonal"
        label="Invalidate companies"
        :disabled="processing"
      />
      <Button
        @click="clearCompanies"
        size="sm"
        variant="tonal"
        label="Clear companies"
        :disabled="processing"
      />
      <Button @click="doAdd" :loading="processing">New Company</Button>
    </div>
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
import { UpmContentSection } from "@upmind-automation/client-vue";
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
