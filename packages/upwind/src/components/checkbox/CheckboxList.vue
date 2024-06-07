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
    :persist-feedback="persistFeedback"
    variant="flat"
  >
    <ul :class="styles.checkboxlist.root">
      <li
        v-for="(item, index) in items"
        :key="item.value"
        :class="styles.checkboxlist.item"
      >
        <upw-checkbox
          v-bind="safeAttrs"
          :id="`${id}-option-${index}`"
          :errors="meta.errors"
          :size="size"
          variant="outlined"
          :label="item.label"
          :value="item.value"
          :model-value="isSelected(item.value)"
          no-status
          no-feedback
          @change="onChange"
        />
      </li>
    </ul>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";
import UpwCheckbox from "../checkbox/Checkbox.vue";

// --- utils
import { useStyles } from "../../utils";
import {
  isEmpty,
  isNil,
  pick,
  includes,
  remove,
  uniq,
  compact,
} from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwCheckboxList",
  inheritAttrs: false,
  emits: ["update:modelValue"],
  components: {
    UpwInput,
    UpwCheckbox,
  },

  props: {
    items: { required: true, type: Array, default: () => [] },
    // ---
    id: {
      type: String,
      default: () => "checkboxlist-" + Math.random().toString(36).substr(2, 9),
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
    checkedIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: "dot",
    },
    uncheckedIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: null,
    },
    // ---
    modelValue: { type: Array },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },

  setup(props, { emit }) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isDisabled: props.disabled,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isChecked: !!props.modelValue,
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("checkboxlist", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
      onChange: event => {
        const selected = props.modelValue || [];
        const checked = event.target.checked;
        const value = event.target.value;
        remove(selected, item => item == value);
        if (checked) selected.push(value);

        // ensure we return a nice clean array
        emit("update:modelValue", uniq(compact(selected)));
      },
      isSelected: value => {
        return includes(props.modelValue, value);
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
