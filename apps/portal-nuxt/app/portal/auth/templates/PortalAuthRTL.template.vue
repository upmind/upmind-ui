<template>
  <PortalAuthShell variant="split">
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
// The mirror of the LTR page: the brand rail leads and the form follows,
// which is the default order of the shell's split arrangement.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
