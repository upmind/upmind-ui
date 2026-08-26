<template>
  <FormField v-bind="formFieldProps" no-errors>
    <Tabs
      v-if="oneOfItems.length > 1"
      :tabs="oneOfItems"
      :model-value="String(selectedIndex)"
      @update:model-value="toggleTab"
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
import {
  createDefaultValue,
  isOneOfControl,
  optionIs,
  and
} from "@jsonforms/core";
import { useJsonFormsOneOfControl, DispatchRenderer } from "@jsonforms/vue";
import { Tabs } from "@upmind/ui";
import { computed, ref } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { createIndexedOneOfRenderInfos } from "../utils";
import { forEach } from "lodash-es";
import type {
  ControlElement,
  CombinatorSubSchemaRenderInfo,
  JsonSchema
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
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

const oneOfItems = computed(() => {
  return (
    control.value.schema?.oneOf?.map((item: JsonSchema, index: number) => ({
      value: String(index),
      label: String(item.title)
    })) || []
  );
});

const toggleTab = (value: string | number) => {
  selectedIndex.value = Number(value);
  defaultsSet.value = false;
};

const setDefaults = () => {
  if (!defaultsSet.value) {
    const schema = control.value.schema?.oneOf?.[selectedIndex.value] as
      | (JsonSchema & { applyDefaults?: string[] })
      | undefined;
    const applyDefaults = schema?.applyDefaults;

    const defaults = createDefaultValue(
      formData.value[selectedIndex.value].schema,
      control.value.rootSchema
    ) as Record<string, unknown>;

    if (applyDefaults) {
      forEach(applyDefaults, (key: string) => {
        defaults[key] = (control.value.data as Record<string, unknown>)[key];
      });
    }

    onInput(defaults, false);
    defaultsSet.value = true;
  }
};
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isOneOfControl, optionIs("toggle", true))
};
</script>
