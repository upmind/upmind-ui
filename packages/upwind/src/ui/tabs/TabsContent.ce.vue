<template>
  <TabsContent :class="styles.tabs.content">
    <slot />
  </TabsContent>
</template>

<script lang="ts">
import { defineComponent, h } from "vue";
import { defineCustomElement } from "vue";
import { TabsContent } from "radix-vue";
import config from "./tabs.config";
import { useStyles } from "../../utils";

const UwTabsContent = defineComponent({
  name: "UwTabsContent",
  components: {
    TabsContent,
  },
  setup() {
    const styles = useStyles("tabs", {}, config);
    return { styles };
  },
  inheritAttrs: false,
});

export default defineCustomElement({
  props: UwTabsContent.props,
  setup: UwTabsContent.setup,
  render: () => h(UwTabsContent),
  styles: [],
  shadowRoot: null,
});
</script>
