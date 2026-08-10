<template>
  <ModuleStateNotice
    v-if="state !== ModuleState.READY"
    :state="state"
    :detail="detail"
  />
  <UpmForm
    v-else
    :schema="schema"
    :uischema="uischema"
    :model-value="model"
    :additional-renderers="formRenderers"
    @update:model-value="onUpdate"
    @resolve="onResolve"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/FormFlowSurface
 * @description The Form-Flow archetype surface — `UpmForm` bound to
 * `snapshot.context.{schema,uischema,model}`. `set`/`resolve` are the
 * Form-Flow archetype's own action-name convention (mirrored from the
 * `useAuth` reference usage, `pages/useAuth/[...scopeSuffix].vue`) — never
 * invented here.
 */

import { computed } from "vue";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import { resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { isFunction } from "lodash-es";
import type { FormFlowSurfaceProps } from "./FormFlowSurface.types";
import type { FormProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<FormFlowSurfaceProps>();

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
</script>
