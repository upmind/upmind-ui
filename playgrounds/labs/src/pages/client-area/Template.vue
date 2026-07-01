<template>
  <UpmLayout>
    <div v-if="template">
      <h1 v-if="template.title">{{ template.title }}</h1>
      <Markdown :model-value="template.body" />
    </div>
    <div v-else-if="meta.isLoading" class="text-center text-gray-500">
      <span>Loading</span>
    </div>
    <div v-else-if="meta.hasError" class="text-center text-red-500">
      Template not found or error occurred.
    </div>
  </UpmLayout>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import { useClientTemplate } from "@upmind-automation/headless";
import { Markdown } from "@upmind-automation/upmind-ui";
import type { ClientTemplateSlotCodes } from "@upmind-automation/types";

const route = useRoute();
const code = route.query.code as ClientTemplateSlotCodes;
const objectId = route.query.objectId as string;

const { data: template, meta } = useClientTemplate({ code, objectId });
</script>
