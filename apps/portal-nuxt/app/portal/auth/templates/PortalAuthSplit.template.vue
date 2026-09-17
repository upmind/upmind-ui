<template>
  <PortalAuthShell variant="offset" card>
    <slot name="back" />
    <slot name="hero" />
    <slot name="form" />
    <slot name="actions" />

    <template #brand>
      <slot name="markdown" />
      <slot name="summary" />
    </template>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// The cart's split page gives the marketing copy its own half. `offset` is
// the shell's asymmetric two-pane arrangement, and it is canvas-toned, so the
// form takes the card this app already draws around its forms.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
