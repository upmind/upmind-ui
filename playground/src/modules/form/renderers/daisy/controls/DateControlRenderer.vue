<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :id="control.id + '-input'"
      type="date"
      :class="[
        styles.control.input,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry
} from "@jsonforms/core";
import { rankWith, isDateControl } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";

const controlRenderer = defineComponent({
  name: "DateControlRenderer",
  components: {
    ControlWrapper
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  setup(props: RendererProps<ControlElement>) {
    return useDaisyControl(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
  }
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isDateControl)
};
</script>
