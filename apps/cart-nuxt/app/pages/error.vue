<template>
  <UpmError
    :status="statusCode"
    :storefront-route="{ name: ROUTE.STOREFRONT }"
  />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { ROUTE } from "~/router/types";

definePageMeta({
  name: ROUTE.ERROR
});

const route = useRoute();

// Get status code from query param, defaulting to 500
const statusCode = computed(() => {
  const code = Number(route.query.status);
  return !isNaN(code) && code >= 400 ? code : 500;
});
</script>
