<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :id="control.id + '-input'"
      :class="[
        'pl-12',
        styles.control.input,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :value="control.data?.number"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      type="phone"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />

    <details
      tabindex="-1"
      ref="target"
      class="dropdown dropdown-start absolute top-2 left-3"
      :class="{ 'dropdown-open': open }"
      :open="open"
      @toggle="doToggle($event.currentTarget.open)"
      :disabled="!control.enabled"
    >
      <summary role="button" class="btn btn-sm btn-square btn-ghost">
        <i
          :class="[
            'fi',
            `fi-${control.data?.country?.toLowerCase() || defaultContry.code.toLowerCase()}`
          ]"
          class="'w-6', 'h-full'"
        ></i>
        <span class="sr-only">{{ control.data?.country }} Dailing code</span>
      </summary>
      <ul
        tabindex="0"
        class="menu menu-xs dropdown-content z-10 p-2 shadow bg-base-100 rounded w-52 mt-0 max-h-60 overflow-auto flex-nowrap"
      >
        <li v-for="country in countries" :key="country">
          <a
            @click="onChangeCountry(country.code, $event)"
            class="no-underline"
          >
            <i
              :class="['fi', `fi-${country.code.toLowerCase()}`]"
              class="'w-6', 'h-full'"
            ></i>
            {{ country.name }}
          </a>
        </li>

        <!-- <li
            :class="{
              disabled: meta.isDefault || !meta.isVerified,
              'opacity-50': meta.isDefault || !meta.isVerified
            }"
          >
            <a
              @click.prevent="setDefault"
              class="no-underline"
              :disabled="meta.isDefault || !meta.isVerified"
              >Set as default</a
            >
          </li> -->
      </ul>
    </details>

    <!-- </div> -->
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
import { defineComponent, ref } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";
import { useSystem } from "@upmind/flow";
import { set } from "lodash-es";
import "flag-icons/css/flag-icons.min.css";
import { onClickOutside } from "@vueuse/core";

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
    const { getCountries, getCountry } = useSystem();
    const countries = getCountries();
    const defaultContry = getCountry();

    const inputControl = useDaisyControl(
      useJsonFormsControl(props),
      () => phone
    );

    const phone = { ...inputControl.control.value.data };

    function onChangeCountry(value: string, target: Event) {
      // set the new country
      set(phone, "country", value);
      // forward the event to the input control that will trigger the update
      inputControl.onChange(target);
    }

    function onChange(target: Event) {
      // set the new  number ( without the country dailing code)
      set(phone, "number", target.currentTarget.value);

      // forward the event to the input control that will trigger the update
      inputControl.onChange(target);
    }

    // ------------------------------------------------

    const target = ref(null);

    onClickOutside(target, () => {
      open.value = false;
    });

    const open = ref(!!props.force);

    function doToggle(value) {
      open.value = value;
    }

    // ------------------------------------------------

    return {
      target,
      open,
      doToggle,
      // ---
      ...inputControl,
      onChangeCountry,
      onChange,
      countries,
      defaultContry
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
