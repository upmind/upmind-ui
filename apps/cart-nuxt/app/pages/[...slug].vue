<template>
  <UpmError :status="404" :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

definePageMeta({
  name: ROUTE.ERROR
});
</script>
