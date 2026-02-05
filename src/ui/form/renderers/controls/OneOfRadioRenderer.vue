<template>
  <FormField v-bind="formFieldProps">
    <RadioCards
      :name="control.path"
      :model-value="control.data"
      :items="items"
      :placeholder="appliedOptions?.placeholder"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { isOneOfEnumControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
// --- components
import { RadioCards } from "../../../radio-cards";
import FormField from "../../FormField.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
import { map } from "lodash-es";
// --- types
import type { RadioCardsItemProps } from "../../../radio-cards";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsOneOfEnumControl(props));

const items = computed(() => {
  const { options, schema, data } = control.value as {
    options: (EnumOption & { text?: string })[];
    schema: JsonSchema & { options?: (EnumOption & { text?: string })[] };
    data: any;
  };

  return map(
    schema.options ?? options,
    (option, index): RadioCardsItemProps => {
      return {
        item: option,
        value: option.value,
        label: option.label,
        secondaryLabel: option?.text,
        index,
        modelValue: data
      };
    }
  );
});

export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio"))
};
</script>
