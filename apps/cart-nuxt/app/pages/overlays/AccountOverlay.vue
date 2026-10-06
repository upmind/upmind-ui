<template>
  <UpmAccount
    :model-value="mode"
    @resolve="doResolve"
    :cancel-route="{ name: ROUTE.BASKET }"
  />
</template>

<script lang="ts" setup>
/**
 * Auth Overlay Content
 * Renders the session Auth component inside an overlay (drawer/modal).
 * On auth completion, emits close — the OverlayController handles navigation.
 */

import { computed } from "vue";
import { useRoute } from "vue-router";
import { UpmAccount } from "@upmind-automation/auth";
import { ROUTE } from "../../funnels/types";
import { get } from "lodash-es";
import type { AuthProps } from "@upmind-automation/auth";

const emit = defineEmits<{
  close: [];
}>();

// -----------------------------------------------------------------------------

const route = useRoute();

/** Read initial mode from ?mode=login|register query param */
const mode = computed(() => {
  const mode = get(
    route,
    "query.mode",
    get(route, "meta.mode", "login")
  ) as AuthProps["modelValue"];
  return mode;
});

/** Emit close on auth success — OverlayController handles drawer close + navigation */
function doResolve(): void {
  emit("close");
}
</script>
