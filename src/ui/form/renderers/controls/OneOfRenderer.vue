<template>
  <FormField v-bind="formFieldProps">
    <Tabs
      :tabs="oneOfItems"
      :value="String(selectedIndex)"
      :defaultValue="String(selectedIndex)"
      @update:modelValue="toggleTab"
    />

    <DispatchRenderer
      v-if="selectedIndex !== undefined && selectedIndex !== null"
      :schema="indexedOneOfRenderInfos[selectedIndex].schema"
      :uischema="indexedOneOfRenderInfos[selectedIndex].uischema"
      :path="control.path"
      :renderers="control.renderers"
      :cells="control.cells"
      :enabled="control.enabled"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsOneOfControl, DispatchRenderer } from "@jsonforms/vue";
import { createCombinatorRenderInfos } from "@jsonforms/core";

// --- components
import FormField from "../../FormField.vue";
import { Tabs } from "../../../tabs";

// --- utils
import { useUpmindUIRenderer } from "../utils";

// --- types
import type {
  ControlElement,
  CombinatorSubSchemaRenderInfo,
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { TabItem } from "../../../tabs";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps } = useUpmindUIRenderer(
  useJsonFormsOneOfControl(props)
);

const selectedIndex = ref(control.value.indexOfFittingSchema ?? 0);

const indexedOneOfRenderInfos = computed(
  (): (CombinatorSubSchemaRenderInfo & {
    index: number;
  })[] => {
    const oneOfUiSchemas = control.value.uischema.options?.oneOfUiSchema;

    const result = createCombinatorRenderInfos(
      control.value.schema.oneOf!,
      control.value.rootSchema,
      "oneOf",
      control.value.uischema,
      control.value.path,
      control.value.uischemas
    );

    return result
      .filter(info => info.uischema)
      .map((info, index) => {
        if (oneOfUiSchemas && oneOfUiSchemas[index]) {
          return {
            ...info,
            uischema: oneOfUiSchemas[index],
            index: index,
          };
        }
        return { ...info, index: index };
      });
  }
);

const oneOfItems = computed((): TabItem[] => {
  return (
    control.value.schema?.oneOf?.map((item: any, index: number) => ({
      value: String(index),
      label: String(item.title),
    })) || []
  );
});

const toggleTab = (value: any) => {
  const numericValue = parseInt(value, 10);
  selectedIndex.value = numericValue;
};
</script>

<script lang="ts">
import { isOneOfControl, optionIs, and } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isOneOfControl, optionIs("toggle", true)),
};
</script>
