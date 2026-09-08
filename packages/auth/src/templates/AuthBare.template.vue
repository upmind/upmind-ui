<template>
  <div :class="bareRootVariants()">
    <slot name="back" />
    <slot name="hero" />
    <slot name="markdown" />
    <slot name="form" />
    <slot name="summary" />
  </div>
</template>

<script lang="ts" setup>
// The fallback the organisms render inside when the host provides no shell
// template — the standalone `auth` app, `portal-nuxt`, and any widget embed.
// It draws no chrome of its own: Amendment 1 change 3 keeps that app-owned.
import { bareRootVariants } from "../variants";
import type { SessionRoutes } from "../types";

defineProps<SessionRoutes>();

defineOptions({ inheritAttrs: false });
</script>
