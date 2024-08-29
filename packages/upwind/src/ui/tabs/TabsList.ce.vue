<template>
  <TabsList :class="styles.tabs.list">
    <slot />
  </TabsList>
</template>

<script lang="ts">
import { defineComponent, toRefs, h } from "vue";
import { defineCustomElement } from "vue";
import { TabsList } from "radix-vue";
import { useStyles } from "../../utils";
import config from "./tabs.config";
import type { TabsConfig } from ".";

const UwTabsList = defineComponent({
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
    return { props, styles };
  },
  inheritAttrs: false,
});

export default defineCustomElement({
  props: UwTabsList.props,
  setup: UwTabsList.setup,
  render: () => h(UwTabsList),
  styles: [],
  shadowRoot: null,
});
</script>
