<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :id="control.id + '-input'"
      type="datetime-local"
      :class="[
        styles.control.input,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :value="dataTime"
      :disabled="!control.enabled"
      :autofocus="appliedOptions.focus"
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
  JsonFormsRendererRegistryEntry} from "@jsonforms/core";
import {
  rankWith,
  isDateTimeControl
} from "@jsonforms/core";
import { defineComponent } from "vue";
import type {
  RendererProps
} from "@jsonforms/vue";
import {
  rendererProps,
  useJsonFormsControl
} from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";

const toISOString = (inputDateTime: string) => {
  return inputDateTime === "" ? undefined : inputDateTime + ":00.000Z";
};

const controlRenderer = defineComponent({
  name: "DatetimeControlRenderer",
  components: {
    ControlWrapper
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  setup(props: RendererProps<ControlElement>) {
    return useDaisyControl(useJsonFormsControl(props), target =>
      toISOString(target.value)
    );
  },
  computed: {
    dataTime(): string {
      return (this.control.data ?? "").substr(0, 16);
    }
  }
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isDateTimeControl)
};
</script>
