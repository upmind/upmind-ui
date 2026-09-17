<template>
  <PortalAuthShell variant="split">
    <slot name="back" />
    <slot name="hero" />
    <slot name="markdown" />
    <slot name="form" />
    <slot name="actions" />

    <template #brand>
      <slot name="summary" />
    </template>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// Two equal halves, the form leading — what the cart's split page draws, where
// a surface form column sits beside a full-height canvas half. The shell tones
// that form column surface, so the form takes no card.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
