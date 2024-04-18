<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <ul :id="control.id + '-radio'" :class="styles.radiolist.root">
      <template :class="styles.radiolist.title" v-if="appliedOptions?.title">
        {{ appliedOptions.title }}
      </template>

      <li class="sr-only" :class="styles.radiolist.option">
        <control-wrapper-inline
          v-bind="controlWrapper"
          :is-focused="isFocused"
          :size="size"
          label=""
          :id="`${control.id}-option-empty`"
          hide-status
        >
          <upw-radio
            key="empty"
            :name="control.path"
            :disabled="!control.enabled"
            :id="`${control.id}-option-empty`"
            :placeholder="appliedOptions.placeholder"
            :invalid="!!control?.errors"
            :model-value="!control?.data"
            value=""
            @blur="isFocused = false"
            @change="onChange"
            @focus="isFocused = true"
            :upwind-config="[config, upwindConfig]"
          />
        </control-wrapper-inline>
      </li>

      <li
        v-for="(optionElement, optionIndex) in control.options"
        :key="optionElement.value"
        :class="styles.radiolist.option"
      >
        <control-wrapper-inline
          v-bind="controlWrapper"
          :is-focused="isFocused"
          :size="size"
          :label="optionElement.label"
          :id="`${control.id}-option-${optionIndex}`"
          hide-status
        >
          <upw-radio
            :name="control.path"
            :disabled="!control.enabled"
            :id="`${control.id}-option-${optionIndex}`"
            :invalid="!!control?.errors"
            :model-value="control?.data == optionElement.value"
            :value="optionElement.value"
            @blur="isFocused = false"
            @change="onChange"
            @focus="isFocused = true"
            :upwind-config="[config, upwindConfig]"
          />
        </control-wrapper-inline>
      </li>
    </ul>
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { isOneOfEnumControl, optionIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Renderer.vue";
import ControlWrapperInline from "../wrapper/RendererInline.vue";
import UpwRadio from "../../../../radio/Radio.vue";

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
  name: "RadioRenderer",
  components: {
    ControlWrapper,
    ControlWrapperInline,
    UpwRadio,
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
    const styles = useStyles(["radiolist"], props, config, props.upwindConfig);
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target => (target.selectedIndex === 0 ? undefined : target.value)
    );
    return {
      ...renderer,
      styles,
      config, // pass the radio config to the radio component
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio")),
};
</script>
