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
    :persist-feedback="persistFeedback"
    layout="stacked"
    variant="flat"
    no-label
    no-status
    no-required
  >
    <slot name="prepend" v-bind="{ styles: styles.quantitybox }">
      <upw-button
        icon-only
        :label="`Decrement value by ${step}`"
        prependIcon="minus"
        size="square"
        :disabled="!!min && modelValue <= min"
        color="current"
        variant="outlined"
        @click.prevent="doDecrement"
      />
    </slot>

    <input
      :aria-invalid="meta.isInvalid"
      :id="id"
      :value="modelValue"
      @input="onChange"
      type="hidden"
    />

    <span :class="styles.quantitybox.root">{{ modelValue }}</span>

    <slot name="append" v-bind="{ styles: styles.quantitybox }">
      <upw-button
        icon-only
        :label="`Increment value by ${step}`"
        prependIcon="plus"
        size="square"
        :disabled="!!max && modelValue >= max"
        color="current"
        variant="outlined"
        @click.prevent="doIncrement"
      />
    </slot>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";
import UpwButton from "../button/Button.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil, isEmpty, omit } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwQuantitybox",
  inheritAttrs: false,
  emits: ["update:modelValue", "update:increment", "update:decrement"],
  components: {
    UpwInput,
    UpwButton,
  },
  props: {
    id: {
      type: String,
      default: () => "quantitybox-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    size: { type: String as PropType<InputProps["size"]> },
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
    modelValue: { type: Number },
    min: {
      type: Number,
      default: 1,
    },
    max: {
      type: Number,
      default: 10,
    },
    step: {
      type: Number,
      default: 1,
    },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    processing: { type: Boolean },
    // ---
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },

  setup(props, { emit }) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isDisabled: props.disabled,
      isProcessing: props.processing,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("quantitybox", meta, config, props.upwindConfig);

    return {
      meta,
      styles,

      onChange: event => {
        if (props.disabled || props.processing) return;
        emit("update:modelValue", event.target.value);
      },
    };
  },
  computed: {
    safeAttrs() {
      // TODO: maybe whitelist input attributes
      return omit(this.$attrs, ["layout", "variant"]);
    },
  },
  methods: {
    doIncrement() {
      let value = this.modelValue + this.step;
      if (this.max) value = Math.min(value, this.max);
      this.$emit("update:modelValue", value);
    },
    doDecrement() {
      let value = this.modelValue - this.step;
      if (this.min) value = Math.max(value, this.min);
      this.$emit("update:modelValue", value);
    },
  },
});
</script>
