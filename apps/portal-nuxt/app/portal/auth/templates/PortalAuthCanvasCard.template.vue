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
// The centred column with the form on a card. The cart draws this one wide,
// with the copy beside the form, and surface-box narrow with the copy above it.
// This app's card wraps the whole column at one width, so the two brand names
// land on the same page here.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
