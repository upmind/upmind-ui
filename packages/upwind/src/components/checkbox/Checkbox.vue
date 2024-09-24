<template>
  <UpwInput
    :id="id"
    :label="label"
    :text="text"
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
    :autofocus="autofocus"
    :dirty="meta.isDirty"
    :disabled="meta.isDisabled"
    :visible="meta.isVisible"
    :required="meta.isRequired"
    :no-required="noRequired"
    :no-feedback="noFeedback"
    :no-status="noStatus"
    :persist-feedback="persistFeedback"
    layout="inline"
    :variant="variant"
    :upwind-config="[upwindConfig, config]"
  >
    <span :class="styles.checkbox.root">
      <input
        :id="id"
        v-bind="safeAttrs"
        type="checkbox"
        :disabled="disabled"
        :checked="modelValue"
        :class="styles.checkbox.input"
        @input="onChange"
        :aria-invalid="meta.isInvalid"
      />
      <UpwIcon
        :class="styles.checkbox.icon"
        :icon="computedIcon"
        v-if="computedIcon"
      />
    </span>
    <!-- expose our core input slots -->
    <template #label="slotProps">
      <slot name="label" v-bind="{ meta, ...slotProps }"></slot>
    </template>

    <template #prepend="slotProps">
      <slot name="prepend" v-bind="{ meta, ...slotProps }"></slot>
    </template>

    <template #append="slotProps">
      <slot name="append" v-bind="{ meta, ...slotProps }"></slot>
    </template>
  </UpwInput>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";
import UpwIcon from "../../ui/icon/Icon.ce.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil, isEmpty, pick } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UwpwCheckbox",
  inheritAttrs: false,
  emits: ["update:modelValue"],
  components: {
    UpwInput,
    UpwIcon,
  },

  props: {
    id: {
      type: String,
      default: () => "checkbox-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    text: { type: String },
    description: { type: String },
    errors: { type: [String, Array] },
    // ---
    size: { type: String as PropType<InputProps["size"]> },
    variant: {
      type: String as PropType<InputProps["variant"]>,
      default: "flat",
    },
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
    checkedIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: "check",
    },
    uncheckedIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: null,
    },
    indeterminateIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: "minus",
    },
    // ---
    modelValue: { type: Boolean },
    // ---
    autofocus: { type: Boolean },
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    processing: { type: Boolean },
    // ---
    noInput: { type: Boolean },
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  setup(props, { emit }) {
    const meta = computed(() => ({
      size: props.size,
      noInput: props.noInput,
      // ---
      isDisabled: props.disabled,
      isProcessing: props.processing,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isChecked: !!props.modelValue,
      isIndeterminate: isNil(props.modelValue),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("checkbox", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
      config,
      onChange: event => {
        if (props.disabled || props.processing) return;
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
