<template>
  <Suspense>
    <LoginView v-bind="props" />

    <template #fallback>
      <component :is="loading" />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
import { useAuthLoading } from "./shell";
import LoginView from "./views/Login.vue";
import type { AuthViewProps } from "./types";

const props = defineProps<AuthViewProps>();

const { component: loading } = useAuthLoading();
</script>
