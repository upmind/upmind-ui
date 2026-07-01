<template>
  <UpmAuth v-model="mode" @resolve="onAuthComplete" />
</template>

<script lang="ts" setup>
/**
 * Auth Overlay Content
 * Renders the session Auth component inside an overlay (drawer/modal).
 * On auth completion, emits close — the OverlayController handles navigation.
 */

import { ref } from "vue";
import { useRoute } from "vue-router";
import { UpmAuth } from "@upmind-automation/client-vue";
import { get } from "lodash-es";
import type { SessionProps } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const route = useRoute();

const emit = defineEmits<{
  close: [];
}>();

/** Initialize mode from ?mode=login|register query param */
const mode = ref(
  get(route, "query.mode", "login") as SessionProps["modelValue"]
);

/** Emit close on auth success — OverlayController handles drawer close + navigation */
function onAuthComplete(): void {
  emit("close");
}
</script>
