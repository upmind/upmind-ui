<template>
  <Suspense>
    <RegisterView v-bind="props" />

    <template #fallback>
      <component :is="loading" />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
// The boundary seam — see `Login.vue` for why it lives in this package.
import { useAuthLoading } from "./shell";
import RegisterView from "./views/Register.vue";
import type { SESSION_TEMPLATE, SessionRoutes } from "./types";

const props = defineProps<
  SessionRoutes & {
    template?: SESSION_TEMPLATE;
  }
>();

const { component: loading } = useAuthLoading();
</script>
