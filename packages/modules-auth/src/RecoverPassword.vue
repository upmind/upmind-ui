<template>
  <Suspense>
    <RecoverPasswordView v-bind="props" />

    <template #fallback>
      <component :is="loading" />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
import { useAuthLoading } from "./shell";
import RecoverPasswordView from "./views/RecoverPassword.vue";
import type { AuthRecoverViewProps } from "./types";

const props = defineProps<AuthRecoverViewProps>();

const { component: loading } = useAuthLoading();
</script>
