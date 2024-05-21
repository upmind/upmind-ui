<template>
  <div
    role="alert"
    class="alert"
    :class="styles.alert.root"
    v-show="meta.isActive"
  >
    <upw-icon v-if="safeIcon" :icon="safeIcon" :class="styles.alert.icon" />

    <div :class="styles.alert.content">
      <h4 :class="styles.alert.title" v-if="title">
        {{ title }}
      </h4>

      <p :class="styles.alert.text" v-if="text">
        {{ text }}
      </p>

      <p :class="styles.alert.data" v-if="data">
        {{ data }}
      </p>
    </div>

    <div :class="styles.alert.actions">
      <upw-button
        @click.prevent="doClose"
        variant="ghost"
        label="Close the alert"
        prependIcon="close-circle"
        color="current"
        icon-only
        size="sm"
        :class="styles.alert.close"
      />
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent, ref, watch } from "vue";

// --- internal
import config from "./config.cva";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwButton from "../button/Button.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { AlertProps } from "./types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpwAlert",
  components: {
    UpwIcon,
    UpwButton,
  },
  emits: ["update:modelValue", "reject"],
  props: {
    modelValue: {
      type: Boolean,
      default: true,
    },
    // ---
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    data: {
      type: String,
    },

    icon: {
      type: [String, Object],
    },

    // ---

    anchor: {
      type: String as PropType<AlertProps["anchor"]>,
      default: null,
    },

    variant: {
      type: String as PropType<AlertProps["variant"]>,
      default: null,
    },

    color: {
      type: String as PropType<AlertProps["color"]>,
      default: null,
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
  setup(props, { emit }) {
    // --- model
    const open = ref(props.modelValue);
    watch(
      () => props.modelValue,
      value => {
        open.value = value;
      }
    );
    // ---

    const meta = computed(() => ({
      variant: props.variant,
      color: props.color,
      block: props.block,
      anchor: props.anchor,
      // ---
      isInline: props.variant === "inline",
      isActive: props.modelValue,
    }));

    const styles = useStyles(["alert"], meta, config, props.upwindConfig);

    function toggleModal(value) {
      open.value = isNil(value) ? !open.value : value;
      emit("update:modelValue", value);

      if (!open.value) {
        emit("reject");
      }
    }

    return {
      meta,
      styles,
      doClose: () => toggleModal(false),
    };
  },
  computed: {
    safeIcon() {
      if (this.icon) return this.icon;
      switch (this.color) {
        case "error":
          return "alert-circle";
        case "warning":
          return "alert-triangle";
        case "success":
          return "check-circle";
        case "info":
        default:
          return "information-circle";
      }
    },
  },
});
</script>
