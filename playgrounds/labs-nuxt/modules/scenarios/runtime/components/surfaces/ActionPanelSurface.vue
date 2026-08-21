<template>
  <ModuleStateNotice
    v-if="state !== ModuleState.READY"
    :state="state"
    :detail="detail"
  />
  <div v-else :class="styles.actionPanelSurface.root">
    <ActionSlots :actions="slotItems" />
    <UpmForm
      v-if="schema"
      :class="styles.actionPanelSurface.form"
      :schema="schema"
      :uischema="uischema"
      :model-value="model"
      :additional-renderers="formRenderers"
      @update:model-value="onUpdate"
      @resolve="onResolve"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ActionPanelSurface
 * @description The Action-panel archetype surface — one plain-trigger slot
 * per `snapshot.actions` member; when the module is mid-edit
 * (`context.schema` present) it also renders the input form from
 * `context.{schema,uischema,model}`, the same `UpmForm` wiring
 * `FormFlowSurface` uses.
 */

import { computed } from "vue";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { ActionPlacementTypes } from "../../scenario.types";
import ActionSlots from "../ActionSlots.vue";
import { resolveModuleDetail, resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import config from "./ActionPanelSurface.styles";
import { isFunction, map, startCase } from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { ActionPanelSurfaceProps } from "./ActionPanelSurface.types";
import type { FormProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<ActionPanelSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => resolveModuleDetail(props.snapshot.context));

const schema = computed(
  () => props.snapshot.context.schema as FormProps["schema"]
);
const uischema = computed(
  () => props.snapshot.context.uischema as FormProps["uischema"]
);
const model = computed(
  () => props.snapshot.context.model as Record<string, unknown> | undefined
);

function onUpdate(value: unknown): void {
  if (isFunction(props.actions.set)) props.actions.set(value);
}

function onResolve(): void {
  if (isFunction(props.actions.resolve)) props.actions.resolve(model.value);
}

// An ACTION PANEL is its actions — every one is always visible by definition,
// so the placement is the archetype's own rather than a scenario's declaration.
const slotItems = computed<ActionSlotItem[]>(() =>
  map(props.snapshot.actions, name => ({
    name,
    label: startCase(name),
    placement: ActionPlacementTypes.VISIBLE,
    onSelect: () => {
      if (isFunction(props.actions[name])) props.actions[name]();
    }
  }))
);

const meta = computed(() => ({ state: state.value }));
const styles = useStyles(["actionPanelSurface"], meta, config);
</script>
