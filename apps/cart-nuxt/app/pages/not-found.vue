<template>
  <div>
    <h1>Page Not Found</h1>
  </div>
</template>

<script lang="ts" setup>
import { ROUTE } from "~/router/types";

definePageMeta({
  name: ROUTE.NOT_FOUND
});
</script>
