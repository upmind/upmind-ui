<template>
  <DropdownMenu
    v-if="meta.isAuthenticated || meta.isProcessing"
    :items="items"
    :size="size"
    :placement="placement"
    :disabled="meta.isProcessing"
    :ui-config="{ dropdown: config.session.profile }"
    :loading="meta.isProcessing"
    :prepend-avatar="user?.avatar"
    :label="user?.display"
    :toggle="null"
  />
</template>

<script>
// --- external
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { DropdownMenu } from "@upmind-automation/upmind-ui";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Profile",
  components: {
    DropdownMenu,
  },

  emits: [],
  props: {
    size: {
      type: string,
      default: "md",
      validator: value => ["sm", "md", "lg"].includes(value),
    },
    placement: {
      type: string, //as PropType<DropdownProps["position"]>,
      default: "bottom-start",
    },
  },
  setup() {
    const { t } = useI18n();

    const { meta, user, logout } = useSession();

    const styles = useStyles(["session.profile"], meta, config);

    return {
      t,
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
          label: this.t("auth.actions.logout"),
          icon: "logout",
          action: this.logout,
        },
      ];
    },
  },
});
</script>
