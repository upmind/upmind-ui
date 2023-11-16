<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <select
      :id="control.id + '-select'"
      :class="[
        styles.control.select,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autofocus="appliedOptions.focus"
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
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isEnumControl
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsEnumControl,
  RendererProps
} from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";

const controlRenderer = defineComponent({
  name: "EnumControlRenderer",
  components: {
    ControlWrapper
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  setup(props: RendererProps<ControlElement>) {
    return useDaisyControl(useJsonFormsEnumControl(props), target =>
      target.selectedIndex === 0 ? undefined : target.value
    );
  }
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isEnumControl)
};
</script>
