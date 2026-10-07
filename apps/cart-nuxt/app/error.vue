<template>
  <UpmError
    :status="error?.statusCode || 500"
    :storefront-route="storefrontRoute"
  />
</template>

<script lang="ts" setup>
import { useStorefrontRoute } from "./composables/useStorefrontRoute";
import UpmError from "./shell/modules/system/Error.vue";
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();
const { storefrontRoute } = useStorefrontRoute();
</script>
