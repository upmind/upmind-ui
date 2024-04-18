<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <span :class="styles.checkbox.root">
      <input
        :autocomplete="appliedOptions.autocomplete"
        :cols="appliedOptions.cols"
        :disabled="!control.enabled"
        :id="control.id + '-input'"
        :max="appliedOptions?.max || control?.schema?.maximum"
        :min="appliedOptions?.min || control?.schema?.minimum"
        :placeholder="appliedOptions.placeholder"
        type="checkbox"
        :checked="!!control.data"
        @blur="isFocused = false"
        @change="onChange"
        @focus="isFocused = true"
        :class="styles.checkbox.input"
      />
      <upw-icon
        :class="styles.checkbox.icon"
        :icon="computedIcon"
        v-if="computedIcon"
      />
    </span>
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { computed, defineComponent } from "vue";
import { isBooleanControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/RendererInline.vue";
import UpwIcon from "../../../../icon/Icon.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../types";
import { isNull, isEmpty, isNil } from "lodash-es";
// ----------------------------------------------

export default defineComponent({
  name: "StringRenderer",
  components: {
    ControlWrapper,
    UpwIcon,
  },
  props: {
    ...rendererProps<ControlElement>(),
    size: {
      type: String as PropType<InputProps["size"]>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const meta = computed(() => ({
      isChecked: !!renderer.control.value.data,
      isIndeterminate: isNull(renderer.control.value.data),

      isInvalid: !isEmpty(renderer.control.value.errors),
      isValid:
        isEmpty(renderer.control.value.errors) &&
        !isNil(renderer.control.value.data),
      isDirty: !isNil(renderer.control.value.data),
      isFocused: renderer.isFocused.value,
      isRequired: renderer.control.value.required,
      isVisible: renderer.control.value.visible,
      isDisabled: !renderer.control.value.enabled,
    }));

    const styles = useStyles("checkbox", meta, config, props.upwindConfig);

    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.checked
    );

    return {
      ...renderer,
      meta,
      styles,
    };
  },
  computed: {
    checkedIcon() {
      return this.appliedOptions?.checkedIcon || "check";
    },
    uncheckedIcon() {
      return this.appliedOptions?.uncheckedIcon || "";
    },
    indeterminateIcon() {
      return this.appliedOptions?.indeterminateIcon || "subtract";
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

export const tester = { rank: 3, controlType: isBooleanControl };
</script>
../../utils ../../utils
