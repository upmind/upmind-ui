<template>
  <h-menu
    as="div"
    :class="styles.profile.root"
    v-slot="{ open }"
    v-if="meta.isAuthenticated || meta.isProcessing"
  >
    <h-menu-button :class="styles.profileButton.root" ref="reference">
      <upw-spinner
        :class="styles.profileButton.loading"
        v-if="meta.isProcessing"
      />

      <figure v-else class="avatar" :class="styles.profileButton.avatar">
        <img
          v-if="user?.avatar?.url"
          :src="user.avatar.url"
          alt="user profile avatar "
          :class="styles.profileButton.image"
        />
        <figcaption
          :class="styles.profileButton.caption"
          v-else-if="user?.avatar?.initials"
        >
          {{ user.avatar.initials }}
        </figcaption>
      </figure>

      <span class="label" :class="styles.profileButton.label">
        {{ user?.display }}
      </span>
    </h-menu-button>

    <transition
      :enter-active-class="styles.profileTransitionEnter.active"
      :enter-from-class="styles.profileTransitionEnter.from"
      :enter-to-class="styles.profileTransitionEnter.to"
      :leave-active-class="styles.profileTransitionLeave.active"
      :leave-from-class="styles.profileTransitionLeave.from"
      :leave-to-class="styles.profileTransitionLeave.to"
    >
      <h-menu-items
        :class="styles.profile.items"
        ref="floating"
        :style="floatingStyles"
      >
        <template v-for="(item, key) in items" :key="key">
          <upm-profile-item v-bind="item" />
        </template>
      </h-menu-items>
    </transition>
  </h-menu>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watch } from "vue";
import { useFloating, offset, flip, shift } from "@floating-ui/vue";

// --- components
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import { UpwSpinner } from "@upmind/upwind";
import UpmProfileItem from "./ProfileItem.vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Profile",
  components: {
    HMenu: Menu,
    HMenuButton: MenuButton,
    HMenuItems: MenuItems,
    UpmProfileItem,
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
      type: String as PropType<DropdownProps["position"]>,
      default: "bottom-end",
    },
  },
  setup(props) {
    const session = useSession();

    const reference = ref(null);
    const floating = ref(null);
    const { floatingStyles } = useFloating(reference, floating, {
      placement: props.placement,
      middleware: [offset(10), flip(), shift()],
    });

    const styles = useStyles(
      [
        "profile",
        "profileButton",
        "profileItem",
        "profileTransitionEnter",
        "profileTransitionLeave",
      ],
      session.meta,
      config
    );

    return {
      ...session,
      styles,
      reference,
      floating,
      floatingStyles,
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
