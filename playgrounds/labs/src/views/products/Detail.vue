<template>
  <Button @click="goBack">Back</Button>
</template>

<script lang="ts" setup>
import { Button } from "@upmind-automation/upmind-ui";
import { useRouter } from "vue-router";

const router = useRouter();

function goBack() {
  router.push({ name: "products.catalogue" });
}
</script>
