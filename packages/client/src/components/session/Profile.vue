<template>
  <upw-dropdown
    v-if="meta.isAuthenticated || meta.isProcessing"
    :items="items"
    :size="size"
    :placement="placement"
    density="compact"
    grouped
    :disabled="meta.isProcessing"
  >
    <template #trigger="">
      <upw-spinner :class="styles.profile.loading" v-if="meta.isProcessing" />

      <figure v-else class="avatar" :class="styles.profile.avatar">
        <img
          v-if="user?.avatar?.url"
          :src="user.avatar.url"
          alt="user profile avatar "
          :class="styles.profile.image"
        />
        <figcaption
          :class="styles.profile.caption"
          v-else-if="user?.avatar?.initials"
        >
          {{ user.avatar.initials }}
        </figcaption>
      </figure>

      <span class="label" :class="styles.profile.label">
        {{ user?.display }}
      </span>
    </template>
  </upw-dropdown>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- components
import { UpwSpinner, UpwDropdown } from "@upmind/upwind";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- types
//import type { PropType } from "vue";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Profile",
  components: {
    UpwDropdown,
    UpwSpinner,
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
      default: "bottom-end",
    },
  },
  setup() {
    const session = useSession();

    const styles = useStyles(["profile"], session.meta, config);

    return {
      ...session,
      styles,
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
