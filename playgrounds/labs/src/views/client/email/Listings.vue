<template>
  <UpmContentSection class="mx-auto max-w-app" title="Emails">
    <div class="flex gap-2 pb-6">
      <Button
        @click="fetchEmails"
        size="sm"
        variant="tonal"
        label="Load emails"
        :disabled="processing || emails.length > 0"
      />
      <Button
        @click="invalidateEmails"
        size="sm"
        variant="tonal"
        label="Invalidate emails"
        :disabled="processing"
      />
      <Button
        @click="clearEmails"
        size="sm"
        variant="tonal"
        label="Clear emails"
        :disabled="processing"
      />

      <Button @click="doAdd" :loading="processing">New Email</Button>
    </div>

    <div v-if="processing">Loading...</div>

    <section class="pb-3 md:pb-3" v-for="email in emails" :key="email.id">
      <UpmCard>
        <h3 class="mt-0">{{ email.title }}</h3>
        <p>{{ email.description }}</p>

        <div class="flex gap-2">
          <Button
            @click="doEdit(email.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Edit"
          >
            Edit
          </Button>
          <Button
            @click="doDelete(email.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Delete"
          >
            Delete
          </Button>
          <Button
            @click="setEmailAsDefault(email.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Set Default"
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
import { Button } from "@upmind-automation/upmind-ui";
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";
import { Email, useQuery, useClientEmails } from "@upmind-automation/headless";

const { queryClient } = useQuery();
const { getAll, remove, setDefault } = useClientEmails();

// -----------------------------------------------------------------------------

const router = useRouter();

const emails = ref<Email[]>([]);
const processing = ref<boolean>(false);

function clearEmails() {
  emails.value = [];
}

function fetchEmails() {
  emails.value = [];
  processing.value = true;
  getAll()
    .then(res => (emails.value = res))
    .finally(() => (processing.value = false));
}

function invalidateEmails() {
  return queryClient.invalidateQueries({
    queryKey: ["client", "emails"],
  });
}

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.emails.edit" });
}

function doAdd() {
  router.push({ name: "client.emails.add" });
}

function doDelete(id: string) {
  remove(id).then(() => fetchEmails());
}

function setEmailAsDefault(id: string) {
  setDefault(id).then(() => fetchEmails());
}

onMounted(() => {
  fetchEmails();
});
</script>
