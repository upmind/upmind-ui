<template>
  <TabsList :class="styles.tabs.list">
    <slot />
  </TabsList>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import { TabsList } from "radix-vue";

// --- utils
import { useStyles } from "../../utils";

// --- local
import config from "./tabs.config";

// --- types
import type { TabsConfig } from ".";

export default defineComponent({
  name: "UwTabsList",
  components: {
    TabsList,
  },

  props: {
    color: {
      type: String as TabsConfig["color"],
      default: "base",
    },
    variant: String as TabsConfig["variant"],
    alignment: String as TabsConfig["alignment"],
    width: String as TabsConfig["width"],
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const styles = useStyles("tabs", toRefs(props), config, props.upwindConfig);

    return {
      props,
      styles,
    };
  },
  inheritAttrs: false,
});
</script>
