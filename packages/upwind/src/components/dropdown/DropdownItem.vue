<template>
  <h-menu-item as="template" v-slot="{ active }">
    <a
      v-if="href"
      :href="href"
      :target="target"
      :class="[styles.root, active ? styles.active : '']"
    >
      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.icon"
        class="dropdown-item-icon"
      />

      <span :class="styles.label">{{ label }}</span>
    </a>

    <router-link
      v-else-if="to"
      :to="to"
      :class="[styles.root, active ? styles.active : '']"
    >
      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.icon"
        class="dropdown-item-icon"
      />

      <span :class="styles.label">{{ label }}</span>
    </router-link>

    <button
      v-else-if="isFunction(action)"
      @click="action"
      :class="[styles.root, active ? styles.active : '']"
    >
      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.icon"
        class="dropdown-item-icon"
      />
      <span :class="styles.label">{{ label }}</span>
    </button>

    <span v-else :class="[styles.root, active ? styles.active : '']">
      <upw-icon
        v-if="icon"
        :icon="icon"
        :class="styles.icon"
        class="dropdown-item-icon"
      />
      <span :class="styles.label">{{ label }}</span>
    </span>
  </h-menu-item>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { MenuItem } from "@headlessui/vue";
import UpwIcon from "../icon/Icon.vue";
import { RouterLink } from "vue-router";
import { isFunction } from "lodash-es";

export default defineComponent({
  name: "UpwDropdown",
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
    styles: {
      type: Object,
      default: () => ({}),
    },
  },
  setup() {
    return {
      isFunction,
    };
  },
});
</script>
