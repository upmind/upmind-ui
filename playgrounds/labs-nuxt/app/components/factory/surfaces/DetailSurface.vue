<template>
  <ModuleStateNotice v-if="state !== 'ready'" :state="state" :detail="detail" />
  <div v-else>
    <ContextPanel v-if="!isEditing" :context="model" />
    <UpmForm
      v-else
      :schema="derivedSchema"
      :model-value="model"
      :additional-renderers="formRenderers"
      @update:model-value="onUpdate"
      @resolve="onResolve"
    />
    <Button
      class="mt-4"
      size="sm"
      variant="outline"
      icon="edit-05"
      :label="isEditing ? 'Done' : 'Edit'"
      @click="isEditing = !isEditing"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/DetailSurface
 * @description The Detail archetype surface — readonly `context.model`,
 * flipping to a progressive JSONForms edit (design.md FE-2977 §Block C).
 * `set`/`resolve` mirror the Form-Flow archetype's own action-name convention
 * (the only precedent this codebase has for a model-editing composable).
 */

import { computed, ref } from "vue";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";
import ContextPanel from "../ContextPanel.vue";
import { resolveModuleState } from "../module-state";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import {
  isBoolean,
  isFunction,
  isNumber,
  isString,
  transform
} from "lodash-es";
import type { DetailSurfaceProps } from "./DetailSurface.types";
import type { FormProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<DetailSurfaceProps>();

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => props.snapshot.context.error);
const model = computed(
  () =>
    (props.snapshot.context.model as Record<string, unknown> | undefined) ?? {}
);

const isEditing = ref(false);

function scalarSchemaType(
  value: unknown
): "string" | "number" | "boolean" | undefined {
  if (isString(value)) return "string";
  if (isNumber(value)) return "number";
  if (isBoolean(value)) return "boolean";
  return undefined;
}

// Detail modules carry no real schema by classify()'s own construction
// (`isRealJsonSchema`, archetype/archetype.ts) — this derives a minimal,
// scalar-only editing schema from the model's own runtime shape; non-scalar
// fields stay read-only rather than guessing a nested shape.
const derivedSchema = computed<FormProps["schema"]>(() => {
  const properties = transform(
    model.value,
    (acc: Record<string, { type: string }>, value, key) => {
      const type = scalarSchemaType(value);
      if (type) acc[key] = { type };
    },
    {}
  );
  return { type: "object", properties };
});

function onUpdate(value: unknown): void {
  if (isFunction(props.actions.set)) props.actions.set(value);
}

function onResolve(): void {
  if (isFunction(props.actions.resolve)) props.actions.resolve(model.value);
  isEditing.value = false;
}
</script>
