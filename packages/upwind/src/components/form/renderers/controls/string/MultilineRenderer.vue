<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <textarea
      ref="input"
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
      :placeholder="appliedOptions.placeholder"
      :rows="appliedOptions.rows"
      :type="appliedOptions.type"
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
import { defineComponent, ref } from "vue";
import { isStringControl, isMultiLineControl, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Renderer.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../types";
// ----------------------------------------------

export default defineComponent({
  name: "MultiStringRenderer",
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
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
    return {
      ...renderer,
      styles,
      input: ref(),
    };
  },
  methods: {
    resize() {
      debugger;
      if (!this.input || !this.appliedOptions?.autosize) return;
      debugger;
      this.input.style.height = "initial";
      if (this.control.data?.length) {
        this.input.style.height = this.input.scrollHeight + "px";
      }
    },
  },
  watch: {
    "control.data"() {
      this.$nextTick(this.resize);
    },
  },
  mounted() {
    this.$nextTick(this.resize);
  },
});

export const tester = {
  rank: 2,
  controlType: and(isStringControl, isMultiLineControl),
};
</script>
