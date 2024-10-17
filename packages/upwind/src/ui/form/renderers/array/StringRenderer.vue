<template>
  <FormField v-bind="delegatedProps">
    <Input
      :disabled="!control.enabled"
      :max="safeMax"
      :min="safeMin"
      :model-value="control.data"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsMultiEnumControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNil, get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

defineOptions({
  name: "ArrayStringRenderer",
});

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsMultiEnumControl(props)
);

const delegatedProps = computed(() => {
  const options = get(appliedOptions.value, "options", {});

  return {
    id: control.value.id,
    name: control.value.path,
    errors: control.value.errors,
    // ---
    label: control.value.label,
    description: control.value.description,
    // ---
    required: control.value.required,
    disabled: !control.value.enabled,
    visible: control.value.visible,
    ...options,
  };
});

const safeMin: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.min;
  if (!isNil(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (!isNil(minimum)) return minimum;

  return undefined;
});

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.max;
  if (!isNil(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (!isNil(maximum)) return maximum;

  return undefined;
});
</script>

<script lang="ts">
import {
  uiTypeIs,
  and,
  schemaMatches,
  hasType,
  schemaSubPathMatches,
} from "@jsonforms/core";

const hasOneOfItems = (schema: JsonSchema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema) =>
  schema.type === "string" && schema.enum !== undefined;

export const tester = {
  rank: 5,
  controlType: and(
    uiTypeIs("Control"),
    and(
      schemaMatches(
        schema =>
          hasType(schema, "array") &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches("items", schema => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      })
    )
  ),
};
</script>
