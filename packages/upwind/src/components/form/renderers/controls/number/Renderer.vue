<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <input
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      type="number"
      :step="safeStep"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
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
import { isNil, get, isArray, includes } from "lodash-es";

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
          ? parseInt(target.value, 10)
          : Number(target.value)
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
      return get(this.appliedOptions, "step", defaultStep);
    },
  },
});

export const tester = {
  rank: 1,
  controlType: or(isNumberControl, isIntegerControl),
};
</script>
../../utils ../../utils
