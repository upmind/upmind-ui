<template>
  <PortalAuthShell variant="offset" reverse card>
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
// Two columns, the form leading and wider — the cart's two-column-ltr page puts
// a full-width form column beside a narrow aside. `offset` is the shell's
// asymmetric pair, and `reverse` brings the wide column first.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
