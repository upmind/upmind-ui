<template>
  <UpmAuth
    :model-value="mode"
    @resolve="onAuthComplete"
    :storefrontRoute="storefrontRoute"
  />
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
import { UpmAuth } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";

// --- utils
import { get } from "lodash-es";

// --- types
import type { SessionProps } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const route = useRoute();

const emit = defineEmits<{
  close: [];
}>();

/** Read initial mode from ?mode=login|register query param */
const mode = computed(
  () => get(route, "query.mode", "login") as SessionProps["modelValue"]
);

/** Emit close on auth success — OverlayController handles drawer close + navigation */
function onAuthComplete(): void {
  emit("close");
}

const { storefrontRoute } = useStorefrontRoute();
</script>
