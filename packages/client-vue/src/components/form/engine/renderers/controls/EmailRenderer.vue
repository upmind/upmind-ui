<template>
  <FormField v-bind="formFieldProps">
    <Input
      :size="appliedOptions?.size"
      :data-attrs="controlDataAttrs"
      type="email"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :disabled="appliedOptions?.disabled"
      :model-value="control.data"
      @update:model-value="onInput"
    >
      <template v-if="iconAppend" #trailing>
        <Icon :icon="iconAppend" size="xs" :class="iconClass" />
      </template>
    </Input>
  </FormField>
</template>

<script lang="ts" setup>
import { and, or, isStringControl, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { Input } from "@upmind/ui";
import { computed } from "vue";
import { Icon } from "../../../../icon";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();
const { control, formFieldProps, onInput, appliedOptions, controlDataAttrs } =
  useUpmindUIRenderer(useJsonFormsControl(props));

// Trailing status glyph: loading while validating, check on success, else the
// configured append icon.
const iconAppend = computed(() => {
  if (appliedOptions.value?.loading) return "loading-01";
  if (appliedOptions.value?.success) return "check";
  return appliedOptions.value?.iconAppend;
});

// The validating glyph has to spin and the confirmation has to read green —
// without these it is a frozen icon and a body-coloured tick.
const iconClass = computed(() => {
  if (appliedOptions.value?.loading) return "animate-spin";
  if (appliedOptions.value?.success) return "text-success";
  return undefined;
});
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isStringControl, or(formatIs("email")))
};
</script>
