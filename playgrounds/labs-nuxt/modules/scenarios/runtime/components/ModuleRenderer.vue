<template>
  <FormFlowSurface
    v-if="descriptor.archetype.archetype === ARCHETYPE.FORM_FLOW"
    :snapshot="descriptor.snapshot"
    :actions="port.actions"
  />
  <DetailSurface
    v-else-if="descriptor.archetype.archetype === ARCHETYPE.DETAIL"
    :snapshot="descriptor.snapshot"
    :actions="port.actions"
  />
  <ActionPanelSurface
    v-else-if="descriptor.archetype.archetype === ARCHETYPE.ACTION_PANEL"
    :snapshot="descriptor.snapshot"
    :actions="port.actions"
  />
  <ListSurface
    v-else-if="descriptor.archetype.archetype === ARCHETYPE.LIST"
    :snapshot="descriptor.snapshot"
    :actions="port.actions"
    :table="port.table"
    :criteria="port.criteria"
    :presentation="presentation"
    :handoffs="handoffs"
    :locked="locked"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleRenderer
 * @description The archetype dispatcher. Reads
 * `descriptor.archetype.archetype` only — never re-derives it, never imports
 * `classify`/a predicate/any headless business module. Holds no business logic
 * itself; each surface owns its own state/content rendering.
 */

import { ARCHETYPE } from "@upmind-automation/scenario-harness";
import ActionPanelSurface from "./surfaces/ActionPanelSurface.vue";
import DetailSurface from "./surfaces/DetailSurface.vue";
import FormFlowSurface from "./surfaces/FormFlowSurface.vue";
import ListSurface from "./surfaces/ListSurface.vue";
import type { ModuleRendererProps } from "./ModuleRenderer.types";
// -----------------------------------------------------------------------------

const { descriptor, port, presentation, handoffs, locked } =
  defineProps<ModuleRendererProps>();
</script>
