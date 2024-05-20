<template>
  <h-menu-item as="template" v-slot="{ active }">
    <router-link
      v-if="to && !disabled"
      :to="to"
      :class="[
        styles.profileItem.root,
        active ? styles.profileItem.active : '',
      ]"
    >
      <upw-icon v-if="icon" :icon="icon" :class="styles.profileItem.icon" />

      <span :class="styles.profileItem.label">{{ label }}</span>
    </router-link>

    <button
      v-else-if="isFunction(action) && !disabled"
      @click="action"
      :class="[
        styles.profileItem.root,
        active ? styles.profileItem.active : '',
      ]"
    >
      <upw-icon v-if="icon" :icon="icon" :class="styles.profileItem.icon" />
      <span :class="styles.profileItem.label">{{ label }}</span>
    </button>

    <span
      v-else
      :class="[
        styles.profileItem.root,
        active ? styles.profileItem.active : '',
      ]"
    >
      <upw-icon v-if="icon" :icon="icon" :class="styles.profileItem.icon" />
      <span :class="styles.profileItem.label">{{ label }}</span>
    </span>
  </h-menu-item>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import { RouterLink } from "vue-router";
import { MenuItem } from "@headlessui/vue";
import { UpwIcon } from "@upmind/upwind";

// --- local
import config from "./config.cva";
import { useStyles } from "@upmind/upwind";

// --- utils
import { isFunction } from "lodash-es";

export default defineComponent({
  name: "UpwprofileItem",
  inheritAttrs: false,
  components: {
    RouterLink,
    HMenuItem: MenuItem,
    UpwIcon,
  },
  props: {
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
    icon: { type: [String, Object], default: null },

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
    const styles = useStyles(["profileItem"], toRefs(props), config);

    return {
      isFunction,
      styles,
    };
  },
});
</script>
