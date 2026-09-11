<template>
  <Progress
    :model-value="props.value"
    :max="props.max"
    :aria-label="props.label"
    :variant="props.tone"
    size="sm"
    class="w-24"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/meter/Meter
 * @description The `meter` module (`status`-tagged) — a determinate progress
 * bar, over `@upmind/ui`'s `Progress`. Value and scale are config-owned data
 * (`ModuleRef.props`), never hardcoded here.
 */
import { Progress } from "@upmind/ui";
import type { MeterModuleProps } from "./types";

defineOptions({ name: "PortalMeter" });

const props = defineProps<MeterModuleProps>();
</script>
