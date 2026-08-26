<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-display mb-4 text-4xl font-bold">
        {{ error?.statusCode || 500 }}
      </h1>
      <p class="text-muted mb-8">
        {{ error?.message || "An unexpected error occurred" }}
      </p>
      <Button variant="primary" @click="handleError"> Go Home </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button } from "@upmind/ui";

defineProps<{
  error: { statusCode?: number; message?: string };
}>();

function handleError() {
  clearError({ redirect: "/" });
}
</script>
