<template>
  <PortalAuthShell variant="triptych">
    <slot name="back" />
    <slot name="hero" />
    <slot name="form" />
    <slot name="actions" />

    <template #brand>
      <slot name="markdown" />
    </template>

    <template #secondary>
      <slot name="summary" />
    </template>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// The cart's surface-box page sets the form between two rails. The shell's
// triptych is that arrangement: a brand rail, the form, and a muted second
// rail the summary sits in.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
