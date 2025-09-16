<template>
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
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { useClientTemplate } from "@upmind-automation/headless";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";
import { Markdown } from "@upmind-automation/upmind-ui";

const route = useRoute();
const code = route.query.code as ClientTemplateSlotCodes;
const objectId = route.query.objectId as string;

const { data: template, meta } = useClientTemplate({ code, objectId });
</script>
