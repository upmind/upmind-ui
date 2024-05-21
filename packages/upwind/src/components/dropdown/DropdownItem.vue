<template>
  <h-menu-item as="template" v-slot="{ active }">
    <a
      v-if="href && !disabled && !group"
      :href="href"
      :target="target"
      :class="[
        styles.dropdownItem.root,
        active ? styles.dropdownItem.active : '',
      ]"
    >
      <upw-avatar
        v-if="avatar"
        :avatar="avatar"
        :class="styles.dropdownItem.avatar"
        :size="size"
      />

      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.dropdownItem.icon"
        :size="size"
      />

      <upw-icon
        v-if="icon"
        :icon="icon"
        :upwind-config="styles.dropdownItem.icon"
      />

      <span :class="styles.dropdownItem.label">{{ label }}</span>
    </a>

    <router-link
      v-else-if="to && !disabled && !group"
      :to="to"
      :class="[
        styles.dropdownItem.root,
        active ? styles.dropdownItem.active : '',
      ]"
    >
      <upw-avatar
        v-if="avatar"
        :avatar="avatar"
        :class="styles.dropdownItem.avatar"
        :size="size"
      />

      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.dropdownItem.icon"
        :size="size"
      />

      <span :class="styles.dropdownItem.label">{{ label }}</span>
    </router-link>

    <button
      v-else-if="isFunction(action) && !disabled && !group"
      @click="action"
      :class="[
        styles.dropdownItem.root,
        active ? styles.dropdownItem.active : '',
      ]"
    >
      <upw-avatar
        v-if="avatar"
        :avatar="avatar"
        :class="styles.dropdownItem.avatar"
        :size="size"
      />

      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.dropdownItem.icon"
        :size="size"
      />

      <span :class="styles.dropdownItem.label">{{ label }}</span>
    </button>

    <span
      v-else
      :class="[
        styles.dropdownItem.root,
        active ? styles.dropdownItem.active : '',
      ]"
    >
      <upw-avatar
        v-if="avatar"
        :avatar="avatar"
        :class="styles.dropdownItem.avatar"
        :size="size"
      />

      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.dropdownItem.icon"
        :size="size"
      />
      <span :class="styles.dropdownItem.label">{{ label }}</span>
    </span>
  </h-menu-item>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import { MenuItem } from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";
import UpwAvatar from "../avatar/Avatar.vue";
import { RouterLink } from "vue-router";

// --- local
// --- local
import config from "./config.cva";
import { useStyles } from "../../utils";

// --- utils
import { isFunction } from "lodash-es";

export default defineComponent({
  name: "UpwDropdownItem",
  inheritAttrs: false,
  components: {
    RouterLink,
    HMenuItem: MenuItem,
    UpwIcon,
    UpwAvatar,
  },
  props: {
    size: {
      type: String,
      default: "md",
      validator: value => ["sm", "md", "lg"].includes(value),
    },
    group: {
      type: Boolean,
      default: false,
    },
    to: {
      type: [String, Object],
      default: "",
    },
    href: {
      type: String,
      default: "",
    },
    target: {
      type: String,
      default: "_self",
    },
    icon: {
      type: [String, Object] as PropType<DropdownProps["icon"]>,
      default: null,
    },
    avatar: {
      type: [String, Object] as PropType<DropdownProps["avatar"]>,
      default: null,
    },

    label: {
      type: String,
      default: "",
    },
    action: {
      type: Function,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // --- Provide precalculated styles from parent. This is to avoid recalculating styles for each item.
    styles: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const styles = useStyles(["dropdownItem"], toRefs(props), config);

    return {
      isFunction,
      styles,
    };
  },
});
</script>
