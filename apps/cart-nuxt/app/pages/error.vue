<template>
  <div>
    <h1>An Error Occurred</h1>
  </div>
</template>

<script lang="ts" setup>
import { ROUTE } from "~/router/types";

definePageMeta({
  name: ROUTE.ERROR
});
</script>
