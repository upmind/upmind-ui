<template>
  <link rel="stylesheet" :href="stylesheet" />

  <tabs-root
    :modelValue="modelValue"
    :defaultValue="defaultValue"
    :orientation="orientation"
    :dir="dir"
    :activationMode="activationMode"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <tabs-list :class="styles.tabs.list" :color="color" :variant="variant">
      <template v-for="(value, index) in tabs" :key="value">
        <tabs-trigger
          :value="value"
          :class="styles.tabs.trigger"
          :color="color"
          :variant="variant"
        >
          <!-- <span v-if="icons" >
            <uw-icon
              :class="styles.tabs.icon"
              :icon="icon[index]"
              aria-hidden="true"
            />
          </span> -->
          <slot :name="`trigger.${value}`"></slot>
        </tabs-trigger>
      </template>
    </tabs-list>

    <template v-for="value in tabs" :key="value">
      <tabs-content :value="value" :class="styles.tabs.content">
        <slot :name="`content.${value}`"></slot>
      </tabs-content>
    </template>
  </tabs-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// ---components
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "radix-vue";

// --- internal

import { useStyles, stylesheet } from "../../utils";
import config from "./tabs.config";

// --- utils

// --- types
import type { PropType } from "vue";
import type { TabsRootProps } from "radix-vue";
import type { TabsConfig } from "./types";
// ---------
export default defineComponent({
  name: "UwTabs",
  components: {
    TabsRoot,
    TabsList,
    TabsTrigger,
    TabsContent,
  },
  props: {
    tabs: {
      type: Array,
      required: true,
    },
    icons: {
      type: Array,
      required: false,
    },
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
    color: { type: String as TabsConfig["color"] },
    variant: String as TabsConfig["variant"],
    alignment: String as TabsConfig["alignment"],
    width: String as TabsConfig["width"],
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue"],
  setup(props) {
    const styles = useStyles("tabs", toRefs(props), config, props.upwindConfig);
    return { stylesheet, styles };
  },
});
</script>
