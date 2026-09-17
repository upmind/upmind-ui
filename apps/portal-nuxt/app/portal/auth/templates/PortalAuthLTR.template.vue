<template>
  <PortalAuthShell variant="split" reverse>
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
// Two columns, the form leading. `reverse` puts the form column first
// and the brand rail second, as the cart's own two-column-ltr page draws it.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
