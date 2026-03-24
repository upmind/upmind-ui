<template>
  <Auth :model-value="initialMode" @resolve="onAuthComplete" />
</template>

<script lang="ts" setup>
/**
 * Auth Overlay Content
 * Renders the session Auth component inside an overlay (drawer/modal).
 * On auth completion, emits close — the OverlayController handles navigation.
 */

// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- internal
import Auth from "../../modules/session/components/Auth.vue";

// --- utils
import { get } from "lodash-es";

// --- types
import type { SessionProps } from "../../modules/session/types";

// -----------------------------------------------------------------------------

const route = useRoute();

const emit = defineEmits<{
  close: [];
}>();

/** Read initial mode from ?mode=login|register query param */
const initialMode = computed(
  () => get(route, "query.mode", "login") as SessionProps["modelValue"]
);

/** Emit close on auth success — OverlayController handles drawer close + navigation */
function onAuthComplete(): void {
  emit("close");
}
</script>
