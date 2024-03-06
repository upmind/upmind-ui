<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <ul
      :id="control.id + '-input'"
      class="radiolist bg-base-100 w-full rounded-btn m-0 gap-2"
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
        class="p-0 m-0"
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
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import { rankWith, isOneOfEnumControl, optionIs, and } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprimevueControl } from "../util";

const controlRenderer = defineComponent({
  name: "EnumOneofControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprimevueControl(useJsonFormsOneOfEnumControl(props), target =>
      target.selectedIndex === 0 ? undefined : target.value
    );
  },
});

export default controlRenderer;

export const isRadioControl = and(
  isOneOfEnumControl,
  optionIs("format", "radio")
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isRadioControl),
};
</script>
