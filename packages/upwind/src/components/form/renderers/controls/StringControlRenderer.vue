<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      shabba="ranks"
      :id="control.id + '-input'"
      :class="[
        styles.control.input,
        appliedOptions?.trim
          ? styles.control?.size?.trim
          : styles.control?.size?.full,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      :type="appliedOptions.type"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import type { ControlElement } from "@jsonforms/core";
import { defineComponent } from "vue";
import { isStringControl } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprelineControl } from "../util";

export default defineComponent({
  name: "StringControlPrelineRenderer",
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

export const tester = { rank: 1, controlType: isStringControl };
</script>
