<template>
  <TabsTrigger :class="styles.tabs.trigger">
    <slot />
  </TabsTrigger>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import { TabsTrigger } from "radix-vue";

// --- utils
import { useStyles } from "../../../utils";

// --- local
import config from "./tabs.config";

// --- types
import type { TabsConfig } from ".";

export default defineComponent({
  components: {
    TabsTrigger,
  },

  props: {
    color: {
      type: String as TabsConfig["color"],
      default: "base",
    },
    variant: String as TabsConfig["variant"],
  },

  setup(props) {
    const styles = useStyles("tabs", toRefs(props), config, props.upwindConfig);

    return {
      props,
      styles,
    };
  },
});
</script>
