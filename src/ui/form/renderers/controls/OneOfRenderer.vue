<template>
  <FormField v-bind="formFieldProps">
    <Tabs
      :tabs="oneOfItems"
      :value="selectedIndex.toString()"
      :defaultValue="selectedIndex.toString()"
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
import { computed, onMounted, ref, nextTick } from "vue";
import { useJsonFormsOneOfControl, DispatchRenderer } from "@jsonforms/vue";
import { createCombinatorRenderInfos } from "@jsonforms/core";

// --- components
import FormField from "../../FormField.vue";
import { Tabs } from "../../../tabs";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isEmpty } from "lodash-es";

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
const selectIndex = ref(selectedIndex.value);
const newSelectedIndex = ref(0);

const indexedOneOfRenderInfos = computed(
  (): (CombinatorSubSchemaRenderInfo & {
    index: number;
  })[] => {
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
      .map((info, index) => ({ ...info, index: index }));
  }
);

const oneOfItems = computed((): TabItem[] => {
  return (
    control.value.schema?.oneOf?.map((item: any, index: number) => ({
      value: String(index),
      label: String(item.title) as string,
    })) || []
  );
});

const toggleTab = (value: any) => {
  const numericValue = parseInt(value, 10);
  console.log("numericValue", numericValue);
  selectIndex.value = numericValue;

  if (control.value.enabled && !isEmpty(control.value.data)) {
    nextTick(() => {
      newSelectedIndex.value = selectIndex.value;
      selectIndex.value = selectedIndex.value;
    });
  } else {
    nextTick(() => {
      selectedIndex.value = selectIndex.value;
    });
  }
};
</script>

<script lang="ts">
import { isOneOfControl } from "@jsonforms/core";
export const tester = { rank: 2, controlType: isOneOfControl };
</script>
