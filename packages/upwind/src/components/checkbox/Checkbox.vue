<template>
  <span :class="styles.checkbox.root">
    <input
      v-bind="$attrs"
      type="checkbox"
      :checked="modelValue"
      :class="styles.checkbox.input"
      @blur="$emit('blur', $event)"
      @change="$emit('update:modelValue', !modelValue)"
      @focus="$emit('focus', $event)"
      :aria-invalid="meta.isInvalid"
    />
    <upw-icon
      :class="styles.checkbox.icon"
      :icon="computedIcon"
      v-if="computedIcon"
    />
  </span>
</template>

<script lang="ts">
// --- global
import { defineComponent, computed, toRefs } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwIcon from "../icon/Icon.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { CheckboxProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwCheckbox",
  inheritAttrs: false,
  emits: ["update:modelValue", "focus", "blur"],
  components: {
    UpwIcon,
  },

  props: {
    checkedIcon: {
      type: [String, Object] as PropType<CheckboxProps["checkedIcon"]>,
      default: "check",
    },
    uncheckedIcon: {
      type: [String, Object] as PropType<CheckboxProps["uncheckedIcon"]>,
      default: null,
    },
    indeterminateIcon: {
      type: [String, Object] as PropType<CheckboxProps["indeterminateIcon"]>,
      default: "subtract",
    },
    // ---
    modelValue: {
      type: Boolean,
      default: null,
    },
    // ---
    invalid: {
      type: Boolean,
      default: null,
    },
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
      type: String as PropType<CheckboxProps["size"]>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: [Array, Object],
      default: null,
    },
  },

  setup(props) {
    const meta = computed(() => ({
      isLoading: props.loading,
      isChecked: !!props.modelValue,
      isIndeterminate: isNil(props.modelValue),
      isValid: !props.invalid && !isNil(props.modelValue),
      isInvalid: props.invalid,
    }));

    const styles = useStyles("checkbox", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
    };
  },

  computed: {
    computedIcon() {
      return this.meta.isIndeterminate
        ? this.indeterminateIcon
        : this.meta.isChecked
          ? this.checkedIcon
          : this.uncheckedIcon;
    },
  },
});
</script>
