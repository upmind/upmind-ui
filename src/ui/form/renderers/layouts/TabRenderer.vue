<template>
  <Tabs
    v-if="tabItems.length > 1"
    :tabs="tabItems"
    :value="String(activeTabIndex)"
    :defaultValue="String(activeTabIndex)"
    @update:modelValue="switchTab"
  />

  <div
    v-for="(tab, index) in tabElements"
    :key="index"
    v-show="index === activeTabIndex"
  >
    <DispatchRenderer
      v-for="element in tab.elements"
      :key="layout.path"
      :schema="layout.schema"
      :uischema="element"
      :path="layout.path"
      :renderers="layout.renderers"
      :cells="layout.cells"
      :enabled="layout.enabled"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsLayout, DispatchRenderer } from "@jsonforms/vue";

// --- components
import { Tabs } from "../../../tabs";

// --- utils
import { useUpmindUILayoutRenderer } from "../utils";
import { get } from "lodash-es";

// --- types
import type { Layout, UISchemaElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { TabItem } from "../../../tabs";

// -----------------------------------------------------------------------------
interface TabElement {
  label: string;
  elements: UISchemaElement[];
}

const props = defineProps<RendererProps<Layout>>();

const { layout } = useUpmindUILayoutRenderer(useJsonFormsLayout(props));

const activeTabIndex = ref(0);

const tabElements = computed((): TabElement[] => {
  return layout.value.uischema.elements.map((element: UISchemaElement) => {
    return {
      label: get(element, "label") ?? "",
      elements: [element]
    };
  });
});

const tabItems = computed((): TabItem[] => {
  return tabElements.value.map((tab: TabElement, index: number) => ({
    value: String(index),
    label: tab.label
  }));
});

const switchTab = (value: string | number) => {
  activeTabIndex.value = Number(value);
};
</script>

<script lang="ts">
import { isLayout, uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Tabs"))
};
</script>
