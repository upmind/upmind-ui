<template>
  <h-menu-item as="template" v-slot="{ active }">
    <component
      :is="safeComponent"
      v-bind="safeAttrs"
      @click="action"
      :class="[
        styles.dropdown.item,
        active ? styles.dropdown.activeItem : '',
        selected ? styles.dropdown.selectedItem : '',
      ]"
    >
      <!-- prepend slot-->
      <slot
        name="prepend"
        v-bind="{
          styles: styles.dropdown,
          prependIcon,
          prependAvatar,
          prependText,
          size,
          label,
          selected,
          disabled,
          loading,
        }"
      >
        <span
          class="prependText"
          :class="styles.dropdown.prepend"
          v-if="prependText"
        >
          {{ prependText }}
        </span>

        <upw-avatar
          v-if="prependAvatar"
          :class="styles.dropdown.avatar"
          :avatar="prependAvatar"
        />

        <upw-icon
          v-if="prependIcon"
          :class="styles.dropdown.icon"
          :icon="prependIcon"
        />
      </slot>

      <!-- default 'slot' -->
      <span class="label" :class="styles.dropdown.label" v-if="label">
        {{ label }}
      </span>

      <!-- append slot -->
      <slot
        name="append"
        v-bind="{
          styles: styles.dropdown,
          appendIcon,
          appendAvatar,
          appendText,
          size,
          label,
          selected,
          disabled,
          loading,
        }"
      >
        <upw-icon
          v-if="appendIcon"
          :class="styles.dropdown.icon"
          :icon="appendIcon"
        />

        <upw-avatar
          v-if="appendAvatar"
          class="avatar"
          :class="styles.dropdown.avatar"
          :avatar="appendAvatar"
        />

        <span
          class="appendText"
          :class="styles.dropdown.append"
          v-if="appendText"
        >
          {{ appendText }}
        </span>

        <!-- loading  -->
        <upw-spinner
          :class="styles.dropdown.loading"
          v-if="loading"
          :size="size"
        />
      </slot>
    </component>
  </h-menu-item>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import { RouterLink } from "vue-router";
import { MenuItem } from "@headlessui/vue";
import UpwIcon from "../../ui/icon/Icon.ce.vue";
import UpwAvatar from "../../ui/avatar/Avatar.ce.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config.cva";
import { useStyles } from "../../utils";

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { DropdownProps } from "./types";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UwpwDropdownItem",
  inheritAttrs: false,
  components: {
    RouterLink,
    HMenuItem: MenuItem,
    UpwIcon,
    UpwAvatar,
    UpwSpinner,
  },
  props: {
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
    // ---
    size: {
      type: String,
      default: "md",
      validator: value => ["sm", "md", "lg"].includes(value),
    },
    // ---
    label: {
      type: String,
      default: "",
    },
    // ---
    appendAvatar: {
      type: [Object, String] as PropType<DropdownProps["avatar"]>,
    },
    appendIcon: { type: [Object, String] as PropType<DropdownProps["icon"]> },
    appendText: { type: String },
    // ---
    prependAvatar: {
      type: [Object, String] as PropType<DropdownProps["avatar"]>,
    },
    prependIcon: { type: [Object, String] as PropType<DropdownProps["icon"]> },
    prependText: { type: String },
    // ---
    action: {
      type: Function,
      default: null,
    },
    // ---
    selected: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },
  setup(props) {
    const styles = useStyles(
      ["dropdown"],
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      isFunction,
      styles,
    };
  },
  computed: {
    safeComponent() {
      // external link
      if (this?.href && !this.disabled && !this.group) return "a";

      // internal link
      if (this?.to && !this.disabled && !this.group) return "RouterLink";

      // button
      if (isFunction(this.action) && !this.disabled && !this.group)
        return "button";

      // fallback
      return "span";
    },
    safeAttrs() {
      if (this?.href && !this.disabled && !this.group)
        return {
          href: this.href,
          target: this?.target,
        };

      // internal link
      if (this?.to && !this.disabled && !this.group) return { to: this.to };

      // button
      if (isFunction(this.action) && !this.disabled && !this.group) return {};

      // fallback
      return {};
    },
  },
});
</script>
