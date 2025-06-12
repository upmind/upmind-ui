<template>
  <Button @click="goBack">Back</Button>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { Button } from "@upmind-automation/upmind-ui";

const router = useRouter();

function goBack() {
  router.push({ name: "products.catalogue" });
}
</script>
