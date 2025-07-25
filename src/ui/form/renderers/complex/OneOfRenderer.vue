<template>
  <FormField v-bind="formFieldProps" no-errors>
    <Tabs
      v-if="oneOfItems.length > 1"
      :tabs="oneOfItems"
      :value="String(selectedIndex)"
      :defaultValue="String(selectedIndex)"
      @update:modelValue="toggleTab"
    />

    <DispatchRenderer
      :key="selectedIndex"
      :schema="formData[selectedIndex].schema"
      :uischema="formData[selectedIndex].uischema"
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
import { createDefaultValue } from "@jsonforms/core";

// --- components
import FormField from "../../FormField.vue";
import { Tabs } from "../../../tabs";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { createIndexedOneOfRenderInfos } from "../utils";
import { forEach } from "lodash-es";

// --- types
import type {
  ControlElement,
  CombinatorSubSchemaRenderInfo
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { TabItem } from "../../../tabs";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsOneOfControl(props)
);

const selectedIndex = ref(control.value.indexOfFittingSchema ?? 0);
const defaultsSet = ref(false);

const formData = computed(
  (): (CombinatorSubSchemaRenderInfo & {
    index: number;
  })[] => {
    return createIndexedOneOfRenderInfos(control.value);
  }
);

const oneOfItems = computed((): TabItem[] => {
  return (
    control.value.schema?.oneOf?.map((item: any, index: number) => ({
      value: String(index),
      label: String(item.title)
    })) || []
  );
});

const toggleTab = (value: any) => {
  selectedIndex.value = Number(value);
  defaultsSet.value = false;
};

const setDefaults = () => {
  if (!defaultsSet.value) {
    const applyDefaults = (
      control.value.schema?.oneOf?.[selectedIndex.value] as any
    )?.applyDefaults;

    const defaults = createDefaultValue(
      formData.value[selectedIndex.value].schema,
      control.value.rootSchema
    );

    if (applyDefaults) {
      forEach(applyDefaults, (key: any) => {
        defaults[key] = control.value.data[key];
      });
    }

    onInput(defaults, false);
    defaultsSet.value = true;
  }
};
</script>

<script lang="ts">
import { isOneOfControl, optionIs, and } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isOneOfControl, optionIs("toggle", true))
};
</script>
