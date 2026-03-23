<template>
  <Auth :model-value="initialMode" @resolve="onAuthComplete" />
</template>

<script lang="ts" setup>
/**
 * Auth Overlay Content
 * Renders the session Auth component inside an overlay (drawer/modal).
 * On authentication completion, navigates to returnRoute (route name) or closes the overlay.
 */

// --- external
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// --- internal
import Auth from "../../modules/session/components/Auth.vue";

// --- utils
import { get } from "lodash-es";

// --- types
import type { SessionProps } from "../../modules/session/types";

// -----------------------------------------------------------------------------

const route = useRoute();
const router = useRouter();

const emit = defineEmits<{
  close: [];
}>();

/** Read initial mode from ?mode=login|register query param */
const initialMode = computed(
  () => get(route, "query.mode", "login") as SessionProps["modelValue"]
);

/** Navigate to returnRoute (route name) on auth success, or emit close */
function onAuthComplete(): void {
  const returnRoute = get(route, "query.returnRoute") as string | undefined;
  if (returnRoute) {
    router.push({ name: returnRoute });
  } else {
    emit("close");
  }
}
</script>
