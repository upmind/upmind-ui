<template>
  <TabsContent :class="styles.tabs.content">
    <slot />
  </TabsContent>
</template>

<script lang="ts">
// --- external
import { TabsContent } from "radix-vue";

// --- internal
import config from "./tabs.config";

// --- utils
import { useStyles } from "../../utils";

export default {
  name: "UwTabsContent",
  components: {
    TabsContent,
  },

  setup() {
    const styles = useStyles("tabs", {}, config);

    return {
      styles,
    };
  },
  inheritAttrs: false,
};
</script>
