<template>
  <UpmLayout>
    <h1 class="mb-4 text-2xl font-bold">Client Templates</h1>

    <div v-if="meta.isLoading" class="text-center text-gray-500">
      Loading templates...
    </div>

    <div v-else>
      <div
        v-if="data.length"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="slot in data"
          :key="slot.id"
          class="rounded-sm p-4"
          @click="redirectToTemplatePage(slot.code)"
        >
          <h2 class="text-xl font-semibold">{{ slot.title }}</h2>
          <p>{{ slot.description }}</p>
        </div>
      </div>

      <div v-else class="text-center text-gray-500">No templates found.</div>
    </div>
  </UpmLayout>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import { useBrand, useClientSlots } from "@upmind-automation/headless";
import type { ClientTemplateSlotCodes } from "@upmind-automation/types";

const router = useRouter();
const { brandId } = useBrand();
const { data, meta } = useClientSlots();

function redirectToTemplatePage(code: ClientTemplateSlotCodes) {
  router.push({
    name: "client-area.template",
    query: { code, objectId: brandId.value }
  });
}
</script>
