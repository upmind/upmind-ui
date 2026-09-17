<template>
  <PortalAuthShell variant="centered" card>
    <slot name="back" />
    <slot name="form" />
    <slot name="actions" />
  </PortalAuthShell>
</template>

<script setup lang="ts">
// The one-page flow's card. It drops the hero and the marketing copy,
// exactly as the cart's inset page does: the card and the back link are the
// whole page.
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
