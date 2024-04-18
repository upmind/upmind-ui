<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
  >
    <select
      :id="control.id + '-input'"
      :class="[
        styles.control.select,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <option key="empty" value="" :class="styles.control.option" />
      <option
        v-for="optionElement in control.options"
        :key="optionElement.value"
        :value="optionElement.value"
        :label="optionElement.label"
        :class="styles.control.option"
      ></option>
    </select>
  </control-wrapper>
</template>

<script lang="ts">
import type { ControlElement } from "@jsonforms/core";
import { isOneOfEnumControl } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import ControlWrapper from "./wrapper/Renderer.vue";
import { useUpwindRenderer } from "../utils";

const controlRenderer = defineComponent({
  name: "EnumOneofRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const enumControl = useJsonFormsOneOfEnumControl(props);

    return useUpwindRenderer(enumControl, target => {
      if (target.selectedIndex) {
        const value =
          enumControl.control.value.options[target.selectedIndex - 1].value;
        return value;
      }
      return undefined;
    });
  },
});

export default controlRenderer;

export const tester = { rank: 2, controlType: isOneOfEnumControl };
</script>
../utils ../utils
