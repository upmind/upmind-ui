<template>
  <UpmError
    :status="error?.statusCode || 500"
    :storefront-route="storefrontRoute"
  />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();
const { storefrontRoute } = useStorefrontRoute();
</script>
