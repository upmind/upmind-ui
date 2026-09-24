<template>
  <Suspense>
    <RegisterView v-bind="props" />

    <template #fallback>
      <component :is="loading" />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
import { useAuthLoading } from "./shell";
import RegisterView from "./views/Register.vue";
import type { AuthViewProps } from "./types";

const props = defineProps<AuthViewProps>();

const { component: loading } = useAuthLoading();
</script>
