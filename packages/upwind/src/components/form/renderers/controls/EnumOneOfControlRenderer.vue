<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
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
import ControlWrapper from "./ControlWrapper.vue";
import { useprelineControl } from "../utils";

const controlRenderer = defineComponent({
  name: "EnumOneofControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const enumControl = useJsonFormsOneOfEnumControl(props);

    return useprelineControl(enumControl, target => {
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
../utils
