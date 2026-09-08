<template>
  <component
    :is="PortalSettings"
    :presentation="props.presentation ?? 'bar'"
    :collapsed="props.collapsed"
    :emphasis-class="navEmphasisClass(props.emphasis)"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/settings/Settings
 * @description The `settings` module — the sandbox's brand and shape pickers,
 * seated by config. It exists so the entry point is the portal's OWN Settings
 * item, in whichever slot a shape's design puts one, instead of a floating
 * affordance the design never draws.
 *
 * `PortalSettings` is loaded ASYNCHRONOUSLY, and that is load-bearing: it reads
 * `usePortalConfig`, which imports the configs, which build their slots from
 * `registry.ts` — which imports this module. A static import closes that ring
 * and `moduleRef` runs before `MODULE_REF_TAG` is initialised, taking every
 * config down with it. Deferring the import past module init breaks the cycle
 * without moving the pickers out of the dialog they belong in.
 */
import { defineAsyncComponent } from "vue";
import { navEmphasisClass } from "../../variants";
import type { SettingsModuleProps } from "./types";

defineOptions({ name: "PortalSettingsModule" });

const props = defineProps<SettingsModuleProps>();

const PortalSettings = defineAsyncComponent(
  () => import("~/components/PortalSettings.vue")
);
</script>
