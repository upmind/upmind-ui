<template>
  <upw-dropdown
    v-if="meta.isAuthenticated || meta.isProcessing"
    :items="items"
    :size="size"
    :placement="placement"
    grouped
    :disabled="meta.isProcessing"
    :upwind-config="{ dropdown: config.profile }"
    :loading="meta.isProcessing"
    :prepend-avatar="user?.avatar"
    :label="user?.display"
    :toggle="null"
  />
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- components
import { UpwDropdown } from "@upmind/upwind";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmProfile",
  components: {
    UpwDropdown,
  },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {
    size: {
      type: String,
      default: "md",
      validator: value => ["sm", "md", "lg"].includes(value),
    },
    placement: {
      type: String, //as PropType<DropdownProps["position"]>,
      default: "bottom-start",
    },
  },
  setup() {
    const session = useSession();

    const styles = useStyles(["profile"], session.meta, config);

    return {
      ...session,
      styles,
      config,
    };
  },
  computed: {
    items() {
      if (!this.meta.isAuthenticated) return [];

      return [
        {
          label: "Logout",
          icon: "logout",
          action: this.logout,
        },
      ];
    },
  },
});
</script>
