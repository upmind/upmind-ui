<template>
  <span
    v-bind="useTestAttrs({ key: 'fixture-marker', value: props.variant })"
    data-slot="portal-fixture-marker"
    class="border-stroke bg-surface text-body rounded-button inline-flex items-center border px-2 py-1 text-xs whitespace-nowrap"
  >
    {{ props.variant ?? "fixture-marker" }}
  </span>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/FixtureMarker
 * @description The registry's named test double, rendered (registry.ts docs
 * "not a real module"). A visible, locatable node the read-back harness can
 * find per slot to prove independent positioning, group order/axis and
 * single-mount — without pretending the real module set (Task 5) exists yet.
 */
import { useTestAttrs } from "@upmind/ui";
import type { FixtureMarkerProps } from "./types";

defineOptions({ name: "FixtureMarker" });

const props = defineProps<FixtureMarkerProps>();
</script>
