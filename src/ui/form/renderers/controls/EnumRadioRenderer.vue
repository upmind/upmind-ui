<template>
  <FormField v-bind="formFieldProps">
    <RadioCards
      :name="control.path"
      :model-value="control.data"
      :items="items"
      :placeholder="appliedOptions?.placeholder"
      :width="appliedOptions?.width"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { isEnumControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
import { RadioCards } from "../../../radio-cards";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { map } from "lodash-es";
import type { RadioCardsItemProps } from "../../../radio-cards";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

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
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isEnumControl, optionIs("format", "radio"))
};
</script>
