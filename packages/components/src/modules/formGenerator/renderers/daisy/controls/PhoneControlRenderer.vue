<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <div class="join w-full">
      <select
        :id="control.id + '-input'"
        :class="[
          'max-w-fit',
          'join-item',
          styles.control.select,
          controlWrapper.errors ? styles.control.error.select : null
        ]"
        :value="control.data?.country"
        :disabled="!control.enabled"
        @change="onChangeCountry"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >
        <option
          v-for="country in countries"
          :key="country"
          :value="country.code"
          :text="country.code"
        >
          <!-- <i
            :class="[
              'flag-icon',
              `flag-icon-${$_.toString(country.code).toLowerCase()}`
            ]"
          /> -->
        </option>
        <option>ZA</option>
      </select>

      <input
        :id="control.id + '-input'"
        :class="[
          'join-item',
          styles.control.input,
          controlWrapper.errors ? styles.control.error.input : null
        ]"
        :value="control.data?.nationalNumber"
        :disabled="!control.enabled"
        :autocomplete="appliedOptions.autocomplete"
        :placeholder="appliedOptions.placeholder"
        type="phone"
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>
  </control-wrapper>
</template>

<script lang="ts">
import type {
  Tester,
  ControlElement,
  JsonFormsRendererRegistryEntry
} from "@jsonforms/core";

import {
  rankWith,
  schemaTypeIs,
  uiTypeIs,
  schemaMatches,
  and
} from "@jsonforms/core";
import type { Ref } from "vue";
import { defineComponent, ref } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";
import { useSystem } from "@upmind/flow";
import { set } from "lodash-es";
// import "flag-icon-css/css/flag-icon.min.css";

const controlRenderer = defineComponent({
  name: "StringControlRenderer",
  components: {
    ControlWrapper
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  data() {
    return {
      unmask: false
    };
  },
  setup(props: RendererProps<ControlElement>) {
    const { getCountries } = useSystem();
    const countries = getCountries();

    const inputControl = useDaisyControl(
      useJsonFormsControl(props),
      () => phone
    );

    const phone = { ...inputControl.control.value.data };

    function onChangeCountry(target: Event) {
      // set the new country
      set(phone, "country", target.currentTarget.value);
      // forward the event to the input control that will trigger the update
      inputControl.onChange(target);
    }

    function onChange(target: Event) {
      // set the new  number ( without the country dailing code)
      set(phone, "nationalNumber", target.currentTarget.value);

      // forward the event to the input control that will trigger the update
      inputControl.onChange(target);
    }

    return {
      ...inputControl,
      onChangeCountry,
      onChange,
      countries
    };
  }
});

export default controlRenderer;

const isPhoneControl = (): Tester =>
  uiTypeIs("Control") &&
  and(
    schemaTypeIs("object"),
    schemaMatches(schema => !!schema?.isPhoneNumber)
  );

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isPhoneControl())
};
</script>
