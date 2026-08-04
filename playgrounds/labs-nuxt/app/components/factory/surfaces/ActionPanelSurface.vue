<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else class="space-y-4">
    <ActionSlots :actions="slotItems" />
    <UpmForm
      v-if="armedSchema"
      class="max-w-xl"
      :schema="armedSchema"
      :uischema="armedUischema"
      :model-value="armedModel"
      :additional-renderers="formRenderers"
      @update:model-value="armedModel = $event"
      @resolve="fireArmed"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/ActionPanelSurface
 * @description The Action-panel archetype surface — one slot per
 * `snapshot.actions` member, arming an inline input form when the action's
 * schema is present via the `actionSchemas` context convention (design.md
 * FE-2977 §Block C).
 */

import { computed, ref } from "vue";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import ActionSlots from "../ActionSlots.vue";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { isFunction, map, startCase } from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";
import type {
  ActionInputSchema,
  ActionPanelSurfaceProps,
  ActionSchemasContext
} from "./ActionPanelSurface.types";
// -----------------------------------------------------------------------------

const props = defineProps<ActionPanelSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);

const actionSchemas = computed<Record<string, ActionInputSchema>>(
  () => (props.snapshot.context as ActionSchemasContext).actionSchemas ?? {}
);

const armedAction = ref<string | undefined>();
const armedModel = ref<Record<string, unknown>>({});

const armedSchema = computed(() =>
  armedAction.value ? actionSchemas.value[armedAction.value]?.schema : undefined
);
const armedUischema = computed(() =>
  armedAction.value
    ? actionSchemas.value[armedAction.value]?.uischema
    : undefined
);

function selectAction(name: string): void {
  if (actionSchemas.value[name]) {
    armedAction.value = name;
    armedModel.value = {};
    return;
  }
  if (isFunction(props.actions[name])) props.actions[name](undefined);
}

function fireArmed(): void {
  const name = armedAction.value;
  if (name && isFunction(props.actions[name]))
    props.actions[name](armedModel.value);
  armedAction.value = undefined;
  armedModel.value = {};
}

const slotItems = computed<ActionSlotItem[]>(() =>
  map(props.snapshot.actions, name => ({
    name,
    label: startCase(name),
    onSelect: () => selectAction(name)
  }))
);
</script>
