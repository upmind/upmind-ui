<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <select
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-select'"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
      :placeholder="appliedOptions.placeholder"
      :value="control.data"
      @blur="isFocused = false"
      @change="onChange"
      @focus="isFocused = true"
      :class="styles.select.root"
    >
      <option key="empty" value="" :class="styles.select.option" />
      <option
        v-for="optionElement in control.options"
        :key="optionElement.value"
        :value="optionElement.value"
        :label="optionElement.label"
        :class="styles.select.option"
      ></option>
    </select>
  </control-wrapper>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isOneOfEnumControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Renderer.vue";

// --- local
import config from "../enum/config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";
import { find } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../types";
// ----------------------------------------------

export default defineComponent({
  name: "SelectRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
    // ---  Additional Attributes
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
    const styles = useStyles("select", props, config, props.upwindConfig);
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target =>
        find(
          renderer.control.value.options,
          ({ value }) => value == target.value
        )?.value
    );
    return {
      ...renderer,
      styles,
    };
  },
});

export const tester = { rank: 2, controlType: isOneOfEnumControl };
</script>
