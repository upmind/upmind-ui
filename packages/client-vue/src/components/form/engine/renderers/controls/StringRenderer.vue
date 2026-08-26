<template>
  <FormField v-bind="formFieldProps">
    <Input
      :size="appliedOptions?.size"
      :data-attrs="controlDataAttrs"
      :type="appliedOptions?.type"
      :max="safeMax"
      :min="safeMin"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :maxlength="appliedOptions?.maxLength"
      :minlength="appliedOptions?.minLength"
      :disabled="appliedOptions?.disabled"
      :mask="appliedOptions?.mask"
      :model-value="control.data"
      @update:modelValue="onInput"
    >
      <template v-if="appliedOptions?.icon" #leading>
        <Icon :icon="appliedOptions.icon" size="xs" />
      </template>

      <template v-if="canClear" #trailing>
        <Button
          icon-only
          variant="ghost"
          :size="appliedOptions?.size"
          :aria-label="clearLabel"
          @click="onClear()"
        >
          <Icon icon="x-close" size="xs" />
        </Button>
      </template>
    </Input>
  </FormField>
</template>

<script lang="ts" setup>
import { isStringControl } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { Button, Input } from "@upmind/ui";
import { computed } from "vue";
import { Icon } from "../../../../icon";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";

// import type { FormControlRenderProps, FormControlProps } from "../../types";

// interface StringInputOptions extends FormControlProps {
//   type?: "text" | "password" | "email" | "number" | "tel" | "url";
//   placeholder?: string;
//   autocomplete?: string;
//   // min?: number;
//   // max?: number;
//   // step?: number;
//   maxLength?: number;
//   minLength?: number;
// }
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const {
  control,
  appliedOptions,
  onInput,
  onClear,
  translate,
  formFieldProps,
  controlDataAttrs
} = useUpmindUIRenderer(useJsonFormsControl(props));

const canClear = computed(
  () => !!appliedOptions.value?.clearable && !isNil(control.value?.data)
);

/** The clear button carries no visible label, so it owes an accessible one. */
const clearLabel = computed(
  () =>
    (appliedOptions.value?.clearLabel as string | undefined) ??
    translate("action.clear", "Clear")
);

const safeMin: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.minLength;
  if (!isNil(applied)) return applied;

  const minimum = control.value?.schema?.minLength;
  if (!isNil(minimum)) return minimum;

  return undefined;
});

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.maxLength;
  if (!isNil(applied)) return applied;

  const maximum = control.value?.schema?.maxLength;
  if (!isNil(maximum)) return maximum;

  return undefined;
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: isStringControl };
</script>
