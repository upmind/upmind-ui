<template>
  <FormField v-bind="delegatedProps">
    <InputGroup class="relative w-full">
      <Input
        class="pr-12"
        :disabled="!control.enabled"
        :max="safeMax"
        :min="safeMin"
        :model-value="control.data"
        @update:modelValue="onInput"
        :type="unmask ? 'text' : 'password'"
      />
      <Button
        class="absolute right-0 top-0 my-auto mr-3 mt-0.5 transition-all duration-300"
        :class="unmask ? 'opacity-100' : 'opacity-50 hover:opacity-100'"
        variant="link"
        size="sm"
        @click="unmask = !unmask"
      >
        <Icon icon="view" size="xs" />
      </Button>
    </InputGroup>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { and, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import InputGroup from "../../../groups/InputGroup.vue";
import { Input } from "../../../input";
import { Button } from "../../../button";
import { Icon } from "../../../icon";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNil, get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
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

const unmask = ref(false);

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
import { isStringControl } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isStringControl, optionIs("format", "password")),
};
</script>
