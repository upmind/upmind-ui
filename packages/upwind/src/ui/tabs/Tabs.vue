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
import { defineComponent, PropType } from "vue";
import { TabsRoot } from "radix-vue";
import type { TabsRootProps } from "radix-vue";

export default defineComponent({
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
</script>
