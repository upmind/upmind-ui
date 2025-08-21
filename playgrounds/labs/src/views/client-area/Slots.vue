<template>
  <h1 class="mb-4 text-2xl font-bold">Client Templates</h1>

  <div v-if="meta.isLoading" class="text-center text-gray-500">
    Loading templates...
  </div>

  <div v-else>
    <div class="mb-4">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search templates..."
        class="w-full rounded-sm border px-3 py-2"
      />
    </div>

    <div
      v-if="filteredSlots.length"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="slot in filteredSlots"
        :key="slot.id"
        class="rounded-sm bg-white p-4"
        @click="redirectToTemplatePage(slot.code)"
      >
        <h2 class="text-xl font-semibold">{{ slot.name }}</h2>
        <p>{{ slot.description }}</p>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">No templates found.</div>

    <div class="mt-4 flex justify-between">
      <Button @click="prevPage()" :disabled="!meta.hasPrevPage" color="primary">
        <Icon icon="arrow-left" size="xs" />
      </Button>
      <Button @click="nextPage()" :disabled="!meta.hasNextPage" color="primary">
        <Icon icon="arrow-right" size="xs" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ref, computed } from "vue";
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { useBrand, useClientSlots } from "@upmind-automation/headless";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";

const router = useRouter();
const { brandId } = useBrand();
const { data, meta, filter, nextPage, prevPage } = useClientSlots();

// --- data properties ---
const searchTerm = ref("");

// --- computed properties ---
const filteredSlots = computed(() => {
  const term = searchTerm.value.trim();
  return term ? filter(term) : (data.value ?? []);
});

function redirectToTemplatePage(code: ClientTemplateSlotCodes) {
  router.push({
    name: "client-area.template",
    query: { code, objectId: brandId.value }
  });
}
</script>
