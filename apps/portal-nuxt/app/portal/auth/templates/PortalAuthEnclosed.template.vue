<template>
  <PortalAuthShell variant="centered">
    <slot name="back" />
    <slot name="hero" />
    <slot name="markdown" />
    <slot name="form" />
    <slot name="summary" />
    <slot name="actions" />
  </PortalAuthShell>
</template>

<script setup lang="ts">
// One centred column with the form set plainly on the page. The centred
// arrangement draws no rails, so every part the organism fills stacks here.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
