<template>
  <UpmContentSection class="mx-auto max-w-app" title="Phones">
    <div class="flex gap-2 pb-6">
      <Button
        @click="fetchPhones"
        size="sm"
        variant="tonal"
        label="Load phones"
        :disabled="processing || phones.length > 0"
      />
      <Button
        @click="invalidatePhones"
        size="sm"
        variant="tonal"
        label="Invalidate phones"
        :disabled="processing"
      />
      <Button
        @click="clearPhones"
        size="sm"
        variant="tonal"
        label="Clear phones"
        :disabled="processing"
      />

      <Button @click="doAdd" :loading="processing">New Phone</Button>
    </div>

    <div v-if="processing">Loading...</div>

    <section class="pb-3 md:pb-3" v-for="phone in phones" :key="phone.id">
      <UpmCard>
        <h3 class="mt-0">{{ phone.title }}</h3>
        <p>{{ phone.description }}</p>

        <div class="flex gap-2">
          <Button
            @click="doEdit(phone.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Edit"
          >
            Edit
          </Button>
          <Button
            @click="doDelete(phone.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Delete"
            :disabled="!phone.meta.canDelete"
          >
            Delete
          </Button>
          <Button
            @click="setPhoneAsDefault(phone.id)"
            class="mt-2"
            size="sm"
            variant="tonal"
            label="Set Default"
            :disabled="!!phone.meta.isDefault"
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
import { Phone, useClientPhones } from "@upmind-automation/headless";

// --- components
import {
  UpmCard,
  useQuery,
  UpmContentSection,
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

const { getAll, remove, setDefault } = useClientPhones();
const { queryClient } = useQuery();

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

const phones = ref<Phone[]>([]);
const processing = ref<boolean>(false);

function clearPhones() {
  phones.value = [];
}

function fetchPhones() {
  phones.value = [];
  processing.value = true;
  getAll()
    .then(res => (phones.value = res))
    .finally(() => (processing.value = false));
}

function invalidatePhones() {
  return queryClient.invalidateQueries({
    queryKey: ["client", "phones"],
  });
}

function doEdit(id: string) {
  router.push({ params: { id: id }, name: "client.phones.edit" });
}

function doAdd() {
  router.push({ name: "client.phones.add" });
}

function doDelete(id: string) {
  remove(id).then(() => fetchPhones());
}

function setPhoneAsDefault(id: string) {
  setDefault(id).then(() => fetchPhones());
}

onMounted(() => {
  fetchPhones();
});
</script>
