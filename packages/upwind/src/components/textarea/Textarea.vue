<template>
  <upw-input
    :id="id"
    :label="label"
    :description="description"
    :errors="errors"
    :size="size"
    :append-avatar="appendAvatar"
    :append-icon="appendIcon"
    :append-text="appendText"
    :prepend-avatar="prependAvatar"
    :prepend-icon="prependIcon"
    :prepend-text="prependText"
    :feedback-icon="feedbackIcon"
    :dirty="meta.isDirty"
    :disabled="meta.isDisabled"
    :visible="meta.isVisible"
    :required="meta.isRequired"
    :no-required="noRequired"
    :no-feedback="noFeedback"
    :no-status="noStatus"
    :no-label="noLabel"
    :persist-feedback="persistFeedback"
    layout="stacked"
    variant="outlined"
  >
    <textarea
      ref="input"
      :id="id"
      v-bind="safeAttrs"
      :disabled="disabled"
      :value="modelValue"
      :class="styles.textarea.root"
      @blur="onBlur"
      @input="onChange"
      @focus="onFocus"
      :aria-invalid="meta.isInvalid"
    ></textarea>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil, isEmpty, pick } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwCheckbox",
  inheritAttrs: false,
  emits: ["update:modelValue"],
  components: {
    UpwInput,
  },
  props: {
    id: {
      type: String,
      default: () => "textarea-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    size: { type: String as PropType<InputProps["size"]> },
    autosize: { type: Boolean, default: false },
    // ---
    appendAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendText: { type: String },
    // ---
    prependAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependText: { type: String },
    // ---
    feedbackIcon: {
      type: [Object, String] as PropType<IconProps["icon"]>,
      default: "information-circle",
    },
    // ---
    modelValue: { type: String },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    processing: { type: Boolean },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noLabel: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },

  setup(props, { emit }) {
    const focused = ref(false);
    const input = ref();

    const meta = computed(() => ({
      size: props.size,
      // ---
      isFocused: focused.value,
      isDisabled: props.disabled,
      isProcessing: props.processing,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("textarea", meta, config, props.upwindConfig);

    function resize() {
      input.value.style.height = "initial";

      if (input.value && props.autosize && meta.value.isFocused) {
        input.value.style.height = input.value.scrollHeight + "px";
      }
    }

    return {
      input,
      meta,
      styles,
      resize,
      onFocus: event => {
        focused.value = true;
        resize();
      },
      onBlur: event => {
        focused.value = false;
        resize();
      },
      onChange: event => {
        if (props.disabled || props.processing) return;
        resize();
        emit("update:modelValue", event.target.value);
      },
    };
  },
  computed: {
    safeAttrs() {
      return pick(this.$attrs, [
        "class",
        "value",
        "readonly",
        "autofocus",
        "placeholder",
        "tabindex",
        "maxlength",
        "name",
        "onChange",
        "onFocus",
        "onBlur",
      ]);
    },
  },
});
</script>
