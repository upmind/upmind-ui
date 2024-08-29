<template>
  <TabsRoot
    v-bind="$attrs"
    :modelValue="modelValue"
    :defaultValue="defaultValue"
    :orientation="orientation"
    :dir="dir"
    :activationMode="activationMode"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>

<script lang="ts">
import { defineComponent, PropType, h } from "vue";
import { defineCustomElement } from "vue";
import { TabsRoot } from "radix-vue";
import type { TabsRootProps } from "radix-vue";

const UwTabs = defineComponent({
  name: "UwTabs",
  components: {
    TabsRoot,
  },
  props: {
    modelValue: {
      type: [String, Number] as PropType<TabsRootProps["modelValue"]>,
    },
    defaultValue: {
      type: [String, Number] as PropType<TabsRootProps["defaultValue"]>,
    },
    orientation: { type: String as PropType<TabsRootProps["orientation"]> },
    dir: { type: String as PropType<TabsRootProps["dir"]> },
    activationMode: {
      type: String as PropType<TabsRootProps["activationMode"]>,
    },
  },
  emits: ["update:modelValue"],
  inheritAttrs: false,
});

export default defineCustomElement({
  props: UwTabs.props,
  emits: UwTabs.emits,
  render: () => h(UwTabs),
  styles: [],
  shadowRoot: null,
});
</script>
