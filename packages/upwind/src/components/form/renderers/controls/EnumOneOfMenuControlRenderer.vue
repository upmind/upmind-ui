<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <ul
      :id="control.id + '-input'"
      class="menu rounded-btn bg-base-100 m-0 w-full gap-2"
      :class="[styles.control.menu.wrapper]"
    >
      <li class="menu-title m-0" v-if="appliedOptions?.title">
        {{ appliedOptions.title }}
      </li>

      <li class="sr-only">
        <input
          type="radio"
          name="menu"
          key="empty"
          value=""
          :class="styles.control.menu.item"
          :checked="!control?.data || control?.data === ''"
        />
        Please select an option
      </li>

      <template
        v-for="optionElement in control.options"
        :key="optionElement.value"
      >
        <li class="m-0 p-0">
          <label :class="{ active: control?.data == optionElement.value }">
            <input
              type="radio"
              name="menu"
              class="sr-only"
              :class="[
                styles.control.menu.item,
                controlWrapper.errors ? styles.control.error.input : null,
              ]"
              :disabled="!control.enabled"
              @change="onChange"
              @focus="isFocused = true"
              @blur="isFocused = false"
              :value="optionElement.value"
              :label="optionElement.label"
              :checked="control?.data == optionElement.value"
            />

            {{ optionElement.label }}
          </label>
        </li>
      </template>
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
import { useprelineControl } from "../utils";

const controlRenderer = defineComponent({
  name: "EnumOneofControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprelineControl(useJsonFormsOneOfEnumControl(props), target =>
      target.selectedIndex === 0 ? undefined : target.value
    );
  },
});

export default controlRenderer;

const isMenuControl = and(isOneOfEnumControl, optionIs("format", "menu"));

export const tester = { rank: 1, controlType: isMenuControl };
</script>
