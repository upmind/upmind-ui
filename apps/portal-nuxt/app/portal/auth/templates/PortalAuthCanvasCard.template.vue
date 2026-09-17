<template>
  <PortalAuthShell variant="centered" card>
    <slot name="back" />
    <slot name="hero" />
    <slot name="markdown" />
    <slot name="form" />
    <slot name="summary" />
    <slot name="actions" />
  </PortalAuthShell>
</template>

<script setup lang="ts">
// The centred column with the form lifted onto a card — the arrangement this
// app's logged-out screens drew before the templates existed.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
