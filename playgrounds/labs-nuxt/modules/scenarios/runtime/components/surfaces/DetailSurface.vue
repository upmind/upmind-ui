<template>
  <ModuleStateNotice
    v-if="state !== ModuleState.READY"
    :state="state"
    :detail="detail"
  />
  <div v-else :class="styles.detailSurface.root">
    <ContextPanel :context="model" />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/DetailSurface
 * @description The Detail archetype surface — `context.model` rendered
 * read-only via `ContextPanel`, and only that. `classify()` guarantees a
 * Detail carries no real schema (`hasModel && !hasRealSchema`,
 * archetype/archetype.ts) — it can never be a form; editing a record is the
 * Form-Flow archetype's job, full stop.
 */

import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import ContextPanel from "../ContextPanel.vue";
import { resolveModuleDetail, resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import config from "./DetailSurface.styles";
import type { DetailSurfaceProps } from "./DetailSurface.types";
// -----------------------------------------------------------------------------

const props = defineProps<DetailSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => resolveModuleDetail(props.snapshot.context));
const model = computed(
  () =>
    (props.snapshot.context.model as Record<string, unknown> | undefined) ?? {}
);

const meta = computed(() => ({ state: state.value }));
const styles = useStyles(["detailSurface"], meta, config);
</script>
