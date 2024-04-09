<template>
  <h-menu-item as="template" v-slot="{ active }">
    <a
      v-if="href"
      :href="href"
      :target="target"
      :class="[styles.root, active ? styles.active : '']"
    >
      <upw-icon v-if="icon" :icon="icon" :upwind-config="styles.icon" />

      <span :class="styles.label">{{ label }}</span>
    </a>

    <router-link
      v-else-if="to"
      :to="to"
      :class="[styles.root, active ? styles.active : '']"
    >
      <upw-icon v-if="icon" :icon="icon" :class="styles.icon" />

      <span :class="styles.label">{{ label }}</span>
    </router-link>

    <button
      v-else-if="isFunction(action)"
      @click="action"
      :class="[styles.root, active ? styles.active : '']"
    >
      <upw-icon v-if="icon" :icon="icon" :class="styles.icon" />
      <span :class="styles.label">{{ label }}</span>
    </button>

    <span v-else :class="[styles.root, active ? styles.active : '']">
      <upw-icon v-if="icon" :icon="icon" :class="styles.icon" />
      <span :class="styles.label">{{ label }}</span>
    </span>
  </h-menu-item>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";

// --- components
import { MenuItem } from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";
import { RouterLink } from "vue-router";

// --- local

// --- utils
import { useStyles } from "../../utils";
import { isFunction } from "lodash-es";

export default defineComponent({
  name: "UpwDropdownItem",
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
    icon: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
    action: {
      type: Function,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const styles = useStyles("dropdown.item", { props }, props.upwindConfig);
    return {
      styles,
      isFunction,
    };
  },
});
</script>
