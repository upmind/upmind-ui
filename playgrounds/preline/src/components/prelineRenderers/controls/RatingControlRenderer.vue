<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <div
      :id="control.id + '-input'"
      class="rating"
      :class="[styles.control.rating.wrapper]"
    >
      <input
        type="radio"
        name="rating"
        class="rating-hidden sr-only"
        :checked="!control?.data"
      />

      <input
        type="radio"
        name="rating"
        class="mask"
        :class="[
          styles.control.rating.item,
          styles.control.rating.item1,
          controlWrapper.errors ? styles.control.error.input : null,
        ]"
        :disabled="!control.enabled"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :value="1"
        :checked="control?.data == 1"
      />
      <input
        type="radio"
        name="rating"
        class="mask"
        :class="[
          styles.control.rating.item,
          styles.control.rating.item2,
          controlWrapper.errors ? styles.control.error.input : null,
        ]"
        :disabled="!control.enabled"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :value="2"
        :checked="control?.data == 2"
      />
      <input
        type="radio"
        name="rating"
        class="mask"
        :class="[
          styles.control.rating.item,
          styles.control.rating.item3,
          controlWrapper.errors ? styles.control.error.input : null,
        ]"
        :disabled="!control.enabled"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :value="3"
        :checked="control?.data == 3"
      />
      <input
        type="radio"
        name="rating"
        class="mask"
        :class="[
          styles.control.rating.item,
          styles.control.rating.item4,
          controlWrapper.errors ? styles.control.error.input : null,
        ]"
        :disabled="!control.enabled"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :value="4"
        :checked="control?.data == 4"
      />
      <input
        type="radio"
        name="rating"
        class="mask"
        :class="[
          styles.control.rating.item,
          styles.control.rating.item5,
          controlWrapper.errors ? styles.control.error.input : null,
        ]"
        :disabled="!control.enabled"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :value="5"
        :checked="control?.data == 5"
      />
    </div>
  </control-wrapper>
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  scopeEndsWith,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsControl,
  type RendererProps,
} from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprelineControl } from "../util";

const controlRenderer = defineComponent({
  name: "RatingControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprelineControl(useJsonFormsControl(props), target =>
      parseInt(target.value || 0)
    );
  },
});

export default controlRenderer;

export const tester = { rank: 2, controlType: scopeEndsWith("rating") };
</script>
