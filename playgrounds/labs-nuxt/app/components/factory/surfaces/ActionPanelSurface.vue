<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else class="space-y-4">
    <ActionSlots :actions="slotItems" />
    <UpmForm
      v-if="schema"
      class="max-w-xl"
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
 * @module factory/surfaces/ActionPanelSurface
 * @description The Action-panel archetype surface — one plain-trigger slot
 * per `snapshot.actions` member; when the module is mid-edit
 * (`context.schema` present) it also renders the input form from
 * `context.{schema,uischema,model}`, the same `UpmForm` wiring
 * `FormFlowSurface` uses (design.md FE-2977 §Block C).
 */

import { computed } from "vue";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import ActionSlots from "../ActionSlots.vue";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { isFunction, map, startCase } from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { ActionPanelSurfaceProps } from "./ActionPanelSurface.types";
import type { FormProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<ActionPanelSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);

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

const slotItems = computed<ActionSlotItem[]>(() =>
  map(props.snapshot.actions, name => ({
    name,
    label: startCase(name),
    onSelect: () => {
      if (isFunction(props.actions[name])) props.actions[name]();
    }
  }))
);
</script>
