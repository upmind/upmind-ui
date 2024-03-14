<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :id="control.id + '-input'"
      type="number"
      :step="1"
      :class="[
        styles.control.input,
        appliedOptions?.trim
          ? styles.control.size.trim
          : styles.control.size.full,
        controlWrapper.errors ? styles.control.error.input : null,
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
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import { rankWith, isIntegerControl } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprimevueControl } from "../util";

const controlRenderer = defineComponent({
  name: "IntegerControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprimevueControl(useJsonFormsControl(props), target =>
      target.value === "" ? undefined : parseInt(target.value, 10)
    );
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(1, isIntegerControl),
};
</script>
