<template>
  <UpmError
    :status="error?.statusCode || 500"
    :storefront-route="storefrontRoute"
  />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import type { NuxtError } from "#app";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";

defineProps<{
  error: NuxtError;
}>();
const { storefrontRoute } = useStorefrontRoute();
</script>
