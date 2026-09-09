<template>
  <Suspense>
    <LoginView v-bind="props" />

    <template #fallback>
      <component :is="loading" />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
// This package owns the boundary its own async organisms need, once, at the
// export every host reaches: `views/Login.vue` awaits the session before it can
// pick a template, and Vue renders NOTHING for an async setup with no
// <Suspense> above it. Putting it here rather than in each host keeps the three
// hosts (cart, cart-nuxt, portal-nuxt) and the standalone app on one shape, and
// keeps the organism's own `provide()` calls ahead of its first await — a
// provide after an await never binds.
import { useAuthLoading } from "./shell";
import LoginView from "./views/Login.vue";
import type { SESSION_TEMPLATE, SessionRoutes } from "./types";

const props = defineProps<
  SessionRoutes & {
    template?: SESSION_TEMPLATE;
  }
>();

const { component: loading } = useAuthLoading();
</script>
