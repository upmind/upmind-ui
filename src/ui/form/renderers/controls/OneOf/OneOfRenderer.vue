<template>
  <FormField v-bind="formFieldProps">
    <Tabs
      :tabs="oneOfItems"
      :value="String(selectedIndex)"
      :defaultValue="String(selectedIndex)"
      @update:modelValue="toggleTab"
    />

    <DispatchRenderer
      :schema="indexedOneOfRenderInfos[selectedIndex].schema"
      :uischema="indexedOneOfRenderInfos[selectedIndex].uischema"
      :path="control.path"
      :renderers="control.renderers"
      :cells="control.cells"
      :enabled="control.enabled"
      @vue:updated="setDefaults"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsOneOfControl, DispatchRenderer } from "@jsonforms/vue";
import {
  createCombinatorRenderInfos,
  createDefaultValue,
} from "@jsonforms/core";

// --- components
import FormField from "../../../FormField.vue";
import { Tabs } from "../../../../tabs";

// --- utils
import { useUpmindUIRenderer } from "../../utils";
import { isEmpty } from "lodash-es";
import { prepareDataForTabSwitch } from "./utils";

// --- types
import type {
  ControlElement,
  CombinatorSubSchemaRenderInfo,
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { TabItem } from "../../../../tabs";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsOneOfControl(props)
);

const selectedIndex = ref(control.value.indexOfFittingSchema ?? 0);
const lastDefaultValue = ref(-1);
const storedModels = ref<Record<number, any>>({});

const setDefaults = () => {
  if (lastDefaultValue.value !== selectedIndex.value) {
    if (!isEmpty(storedModels.value[selectedIndex.value])) {
      // Restores previously entered data when a tab is revisited and we have the model data stored
      onInput(storedModels.value[selectedIndex.value], false);
    } else {
      setDefaultForIndex(selectedIndex.value);
    }
    lastDefaultValue.value = selectedIndex.value;
  }
};

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
  const index = Number(value);

  /**
   * Prepare the default data for when the dispatch renderer fires the @vue:updated event
   * The default data can be the default values from the schema or the data from storage,
   * which contains user input along with default values.
   */
  const { newData, updatedStorage } = prepareDataForTabSwitch(
    control.value,
    storedModels.value,
    selectedIndex.value,
    index,
    indexedOneOfRenderInfos.value
  );

  storedModels.value = updatedStorage;

  // Updates the form data when switching between tabs, applying either stored user input or appropriate defaults for the new schema
  onInput(newData, false);
  selectedIndex.value = index;
  lastDefaultValue.value = index;
};

const setDefaultForIndex = (value: number) => {
  // Initializes model with schema defaults, when no stored model data exists for the selected schema
  onInput(
    createDefaultValue(
      indexedOneOfRenderInfos.value[value].schema,
      control.value.rootSchema
    ),
    false
  );

  selectedIndex.value = value;
};
</script>

<script lang="ts">
import { isOneOfControl, optionIs, and } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isOneOfControl, optionIs("toggle", true)),
};
</script>
