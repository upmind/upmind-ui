<template>
  <UpwDropdown
    v-if="meta.isAuthenticated || meta.isProcessing"
    :items="items"
    :size="size"
    :placement="placement"
    grouped
    :disabled="meta.isProcessing"
    :upwind-config="{ dropdown: config.session.profile }"
    :loading="meta.isProcessing"
    :prepend-avatar="user?.avatar"
    :label="user?.display"
    :toggle="null"
  />
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- components
import { UpwDropdown } from "@upmind/upwind";

// --- internal
import { useSession } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmProfile",
  components: {
    UpwDropdown,
  },

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
    const { meta, user, logout } = useSession();

    const styles = useStyles(["session.profile"], meta, config);

    return {
      meta,
      user,
      styles,
      config,
      logout,
    };
  },
  computed: {
    items() {
      if (!this.meta.isAuthenticated) return [];

      return [
        {
          label: this.$t("auth.actions.logout"),
          icon: "logout",
          action: this.logout,
        },
      ];
    },
  },
});
</script>
