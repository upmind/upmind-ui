<template>
  <UpmLayout>
    <Button @click="goBack">Back</Button>
  </UpmLayout>
</template>

<script lang="ts" setup>
import { Button } from "@upmind-automation/upmind-ui";
import { UpmLayout } from "@upmind-automation/client-vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goBack() {
  router.push({ name: "products.catalogue" });
}
</script>
