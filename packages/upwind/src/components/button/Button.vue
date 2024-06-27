<template>
  <component
    :is="safeComponent"
    v-bind="safeAttrs"
    :class="styles.button.root"
    :disabled="disabled"
  >
    <slot v-if="meta.isLoading" name="loading" v-bind="{ meta }">
      <upw-spinner
        :class="styles.button.spinner"
        class="loading"
        :size="size"
      />
    </slot>

    <slot
      name="prepend-avatar"
      v-bind="{ meta, avatar: prependAvatar }"
      v-if="!iconOnly"
    >
      <upw-icon
        v-if="prependAvatar"
        class="avatar"
        :class="styles.button.avatar"
        :icon="prependAvatar"
      />
    </slot>

    <span class="content" :class="styles.button.content">
      <slot name="prepend-icon" v-bind="{ meta, icon: prependIcon }">
        <upw-icon
          v-if="prependIcon"
          :class="styles.button.icon"
          :icon="prependIcon"
        />
      </slot>

      <slot v-bind="{ meta, label }">
        <span :class="styles.button.label" v-if="label" class="label">
          {{ label }}
        </span>
      </slot>

      <slot
        name="append-icon"
        v-bind="{ meta, icon: appendIcon }"
        v-if="!iconOnly || (iconOnly && !prependIcon)"
      >
        <upw-icon
          v-if="appendIcon"
          :class="styles.button.icon"
          :icon="appendIcon"
        />
      </slot>
    </span>

    <slot
      name="append-avatar"
      v-bind="{ meta, avatar: appendAvatar }"
      v-if="!iconOnly"
    >
      <upw-icon
        v-if="appendAvatar"
        class="avatar"
        :class="styles.button.avatar"
        :icon="appendAvatar"
      />
    </slot>
  </component>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, toRefs } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { ButtonProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwButton",
  components: {
    UpwIcon,
    UpwSpinner,
  },

  props: {
    to: {
      type: String,
      default: null,
    },
    href: {
      type: String,
      default: null,
    },
    target: {
      type: String,
    },
    // ---
    label: {
      type: String,
      default: null,
    },
    prependAvatar: {
      type: [String, Object],
      default: null,
    },
    prependIcon: {
      type: [String, Object],
      default: null,
    },
    appendIcon: {
      type: [String, Object],
      default: null,
    },
    appendAvatar: {
      type: [String, Object],
      default: null,
    },

    // ---
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // ---
    size: {
      type: String as PropType<ButtonProps["size"]>,
      default: null,
    },
    variant: {
      type: String as PropType<ButtonProps["variant"]>,
      default: null,
    },
    color: {
      type: String as PropType<ButtonProps["color"]>,
      default: null,
    },

    iconOnly: {
      type: Boolean,
      default: false,
    },
    block: {
      type: Boolean,
      default: false,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const meta = computed(() => ({
      isLoading: props.loading,
    }));

    const styles = useStyles(
      "button",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      meta,
      styles,
    };
  },
  computed: {
    safeComponent() {
      // external link
      if (this?.href && !this.disabled) return "a";

      // internal link
      if (this?.to && !this.disabled) return "RouterLink";

      // fallback/defauly
      return "button";
    },
    safeAttrs() {
      if (this?.href && !this.disabled)
        return {
          href: this.href,
          target: this?.target,
        };

      // internal link
      if (this?.to && !this.disabled) return { to: this.to };

      // fallback/fallback
      return {};
    },
  },
});
</script>
