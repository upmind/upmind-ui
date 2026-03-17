<template>
  <Auth :model-value="initialMode" @resolve="onAuthComplete" />
</template>

<script lang="ts" setup>
/**
 * Auth Overlay Content
 * Renders the session Auth component inside an overlay (drawer/modal).
 * On authentication completion, navigates to returnUrl or closes the overlay.
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

/** Navigate to returnUrl on auth success, or emit close */
function onAuthComplete(): void {
  const returnUrl = get(route, "query.returnUrl") as string | undefined;
  if (returnUrl) {
    router.push({ name: returnUrl });
  } else {
    emit("close");
  }
}
</script>
