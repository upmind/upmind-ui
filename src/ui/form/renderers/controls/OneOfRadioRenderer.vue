<template>
  <FormField v-bind="formFieldProps">
    <RadioCards
      :name="control.path"
      :model-value="control.data"
      :items="items"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { RadioCards } from "../../../radio-cards";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { map } from "lodash-es";

// --- types
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "../../../radio-cards";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsOneOfEnumControl(props)
);

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
        sublabel: option?.text,
        index,
        modelValue: data
      };
    }
  );
});
</script>

<script lang="ts">
import { isOneOfEnumControl, and, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio"))
};
</script>
