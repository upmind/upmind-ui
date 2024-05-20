<template>
  <h-menu
    as="div"
    :class="styles.profile.root"
    v-slot="{ open }"
    v-if="meta.isAuthenticated"
  >
    <h-menu-button :class="styles.profileButton.root" ref="reference">
      <figure class="avatar" :class="styles.profileButton.avatar">
        <img
          v-if="user.image_url"
          :src="user.image_url"
          alt="user profile avatar "
          :class="styles.profileButton.image"
        />
      </figure>

      <span class="label" :class="styles.profileButton.label">
        {{ user?.public_name || user?.first_name || user?.email || "Profile" }}
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

  <!-- <aside
    class="profile"
    :class="styles.profile.root"
    v-if="meta.isClient && !meta.isProcessing"
  >
    <figure :class="styles.profile.avatar">
      <img
        v-if="user.image_url"
        :src="user.image_url"
        alt="uploaded image thumbnail "
        :class="styles.profile.image"
      />
    </figure>
    <div :class="styles.profile.content">
      <span :class="styles.profile.meta">You're currently logged in as</span>
      <h4 :class="styles.profile.title">{{ user.fullname }}</h4>
      <h5 :class="styles.profile.text">{{ user.email }}</h5>

      <div :class="styles.profile.actions">
        <upw-button
          variant="ghost"
          size="sm"
          to="/"
          icon="profile"
          label="My Account"
        />
        <upw-button
          variant="ghost"
          size="sm"
          @click.prevent="logout"
          icon="logout"
          label="Logout"
        />
      </div>
    </div>
  </aside> -->
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { useFloating, offset, flip, shift } from "@floating-ui/vue";

// --- components
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
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
