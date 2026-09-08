<template>
  <StatusBadge :tone="props.tone" :appearance="props.appearance">
    {{ props.label }}
  </StatusBadge>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/status-block/StatusBlock
 * @description The `status-block` module (tasks.md 5.3, `status`-tagged) — a
 * single entity status, over `@upmind/ui`'s `StatusBadge`. Label and tone are
 * config-owned data (`ModuleRef.props`), never hardcoded here.
 */
import { StatusBadge } from "@upmind/ui";
import type { StatusBlockProps } from "./types";

defineOptions({ name: "PortalStatusBlock" });

const props = defineProps<StatusBlockProps>();
</script>
