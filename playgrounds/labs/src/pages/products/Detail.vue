<template>
  <UpmLayout>
    <Button @click="goBack">Back</Button>
  </UpmLayout>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import { Button } from "@upmind/ui";

const router = useRouter();

function goBack() {
  router.push({ name: "products.catalogue" });
}
</script>
