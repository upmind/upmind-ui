<template>
  <TabsTrigger :class="styles.tabs.trigger">
    <slot />
  </TabsTrigger>
</template>

<script lang="ts">
import { defineComponent, toRefs, h } from "vue";
import { defineCustomElement } from "vue";
import { TabsTrigger } from "radix-vue";
import { useStyles } from "../../utils";
import config from "./tabs.config";
import type { TabsConfig } from ".";

const UwTabsTrigger = defineComponent({
  name: "UwTabsTrigger",
  components: {
    TabsTrigger,
  },
  props: {
    color: {
      type: String as TabsConfig["color"],
      default: "base",
    },
    variant: String as TabsConfig["variant"],
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const styles = useStyles("tabs", toRefs(props), config, props.upwindConfig);
    return { props, styles };
  },
  inheritAttrs: false,
});

export default defineCustomElement({
  props: UwTabsTrigger.props,
  setup: UwTabsTrigger.setup,
  render: () => h(UwTabsTrigger),
  styles: [],
  shadowRoot: null,
});
</script>
