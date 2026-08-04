<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else :class="styles.detailSurface.root">
    <ContextPanel :context="model" />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/DetailSurface
 * @description The Detail archetype surface — `context.model` rendered
 * read-only via `ContextPanel`, and only that (design.md FE-2977 §Block C,
 * R-D2). `classify()` guarantees a Detail carries no real schema
 * (`hasModel && !hasRealSchema`, archetype/archetype.ts) — it can never be a
 * form; editing a record is the Form-Flow archetype's job, full stop.
 */

import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import ContextPanel from "../ContextPanel.vue";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import config from "./DetailSurface.styles";
import type { DetailSurfaceProps } from "./DetailSurface.types";
// -----------------------------------------------------------------------------

const props = defineProps<DetailSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);
const model = computed(
  () =>
    (props.snapshot.context.model as Record<string, unknown> | undefined) ?? {}
);

const meta = computed(() => ({ state: state.value }));
const styles = useStyles(["detailSurface"], meta, config);
</script>
