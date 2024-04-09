<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :id="control.id + '-input'"
      type="time"
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
import type { ControlElement } from "@jsonforms/core";
import { isTimeControl } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprelineControl } from "../utils";

const controlRenderer = defineComponent({
  name: "TimeControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprelineControl(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
  },
});

export default controlRenderer;

export const tester = { rank: 2, controlType: isTimeControl };

// export const entry: JsonFormsRendererRegistryEntry = {
//   renderer: controlRenderer,
//   tester: rankWith(2, isTimeControl),
// };
</script>
../utils
