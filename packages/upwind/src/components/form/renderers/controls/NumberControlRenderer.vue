<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <div
      :disabled="!control.enabled ? 'disabled' : null"
      :class="[
        'inline-flex',
        'items-center',
        'gap-2',
        styles.control.input,
        appliedOptions?.trim
          ? styles.control.size.trim
          : styles.control.size.full,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
    >
      <span :class="styles.control.prefix" v-if="appliedOptions?.prefix">{{
        appliedOptions.prefix
      }}</span>

      <input
        :id="control.id + '-input'"
        type="number"
        :step="step"
        class="flex-1 bg-transparent"
        :value="control.data"
        :disabled="!control.enabled"
        :autocomplete="appliedOptions.autocomplete"
        :cols="appliedOptions.cols"
        :placeholder="appliedOptions.placeholder"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <span :class="styles.control.suffix" v-if="appliedOptions?.suffix">{{
        appliedOptions.suffix
      }}</span>
    </div>
  </control-wrapper>
</template>

<script lang="ts">
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import { rankWith, isNumberControl } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprelineControl } from "../util";

const controlRenderer = defineComponent({
  name: "NumberControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprelineControl(useJsonFormsControl(props), target =>
      target.value === "" ? undefined : Number(target.value)
    );
  },
  computed: {
    step(): number {
      const options: any = this.appliedOptions;
      return options.step ?? 0.1;
    },
  },
});

export default controlRenderer;

export const tester = { rank: 1, controlType: isNumberControl };
</script>
