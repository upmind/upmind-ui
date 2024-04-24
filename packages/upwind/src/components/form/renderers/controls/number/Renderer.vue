<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <input
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      type="number"
      :step="safeStep"
      :max="safeMax"
      :min="safeMin"
      :placeholder="appliedOptions.placeholder"
      :value="control.data"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
      :class="styles.input.root"
    />
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { defineComponent, computed } from "vue";
import {
  isNumberControl,
  isIntegerControl,
  or,
  schemaMatches,
} from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Renderer.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";
import { isNil, get, isArray, includes, values } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../types";
// ----------------------------------------------

export default defineComponent({
  name: "NumberRenderer",
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
    const styles = useStyles("input", props, config, props.upwindConfig);

    const isInteger = computed(() => {
      let type = renderer.control.value.schema.type;
      type = isArray(type) ? type : [type];
      return includes(type, "integer");
    });

    const renderer = useUpwindRenderer(useJsonFormsControl(props), target =>
      isNil(target.value)
        ? undefined
        : isInteger.value
          ? parseInt(target.value)
          : parseFloat(target.value)
    );

    return {
      ...renderer,
      isInteger,
      styles,
    };
  },
  computed: {
    safeStep(): number {
      const defaultStep = this.isInteger ? 1 : 0.1;
      const multipleOf = get(this.control, "schema.multipleOf", defaultStep);
      return get(this.appliedOptions, "step", multipleOf);
    },
    safeMin(): number | null {
      const applied = this.appliedOptions?.min;
      if (!isNil(applied)) return applied;

      const minimum = this.control?.schema?.minimum;
      if (!isNil(minimum)) return minimum;

      const exclusiveMinimum = this.control?.schema?.exclusiveMinimum;
      if (!isNil(exclusiveMinimum)) return exclusiveMinimum + this.safeStep;

      return null;
    },
    safeMax(): number | null {
      const applied = this.appliedOptions?.max;
      if (!isNil(applied)) return applied;

      const maximum = this.control?.schema?.maximum;
      if (!isNil(maximum)) return maximum;

      const exclusiveMaximum = this.control?.schema?.exclusiveMaximum;
      if (!isNil(exclusiveMaximum)) return exclusiveMaximum - this.safeStep;

      return null;
    },
  },
});

export const tester = {
  rank: 1,
  controlType: or(isNumberControl, isIntegerControl),
};
</script>
