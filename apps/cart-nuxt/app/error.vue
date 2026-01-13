<template>
  <UpmError
    :status="error?.statusCode || 500"
    :storefront-route="{ name: ROUTE.STOREFRONT }"
  />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { ROUTE } from "~/router/types";
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();
</script>
