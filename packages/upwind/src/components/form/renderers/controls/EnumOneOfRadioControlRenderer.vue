<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
  >
    <ul
      :id="control.id + '-input'"
      class="radiolist rounded-btn bg-base-100 m-0 w-full gap-2"
      :class="[styles.control.list.wrapper]"
    >
      <li class="radiolist-title m-0" v-if="appliedOptions?.title">
        {{ appliedOptions.title }}
      </li>

      <li class="sr-only">
        <input
          type="radio"
          :name="control.path"
          key="empty"
          value=""
          :class="styles.control.list.item"
          :checked="!control?.data"
        />
      </li>

      <li
        class="m-0 p-0"
        v-for="optionElement in control.options"
        :key="optionElement.value"
      >
        <label
          :class="[
            styles.control.label.root,
            controlWrapper.errors ? styles.control.error.label : null,
            'cursor-pointer',
            'justify-start',
            'gap-2',
          ]"
        >
          <input
            type="radio"
            :name="control.path"
            class="radio"
            :disabled="!control.enabled"
            @change="onChange"
            @focus="isFocused = true"
            @blur="isFocused = false"
            :value="optionElement.value"
            :label="optionElement.label"
            :checked="control?.data == optionElement.value"
          />

          <span class="label-text">
            {{ optionElement.label }}
          </span>
        </label>
      </li>
    </ul>
  </control-wrapper>
</template>

<script lang="ts">
import type { ControlElement } from "@jsonforms/core";
import { isOneOfEnumControl, optionIs, and } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import ControlWrapper from "./wrapper/Wrapper.vue";
import { useUpwindRenderer } from "../utils";

const controlRenderer = defineComponent({
  name: "EnumOneofRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useUpwindRenderer(useJsonFormsOneOfEnumControl(props), target =>
      target.selectedIndex === 0 ? undefined : target.value
    );
  },
});

export default controlRenderer;

const isRadioControl = and(isOneOfEnumControl, optionIs("format", "radio"));

export const tester = { rank: 3, controlType: isRadioControl };
</script>
