<template>
  <FormField v-bind="delegatedProps">
    <div class="group flex w-full" :class="containerClasses">
      <Combobox
        v-model="selectedCountry"
        :items="countryItems"
        class="!w-28 rounded-r-none border-r-0 text-sm !text-opacity-50"
        popover-class="!w-72 ml-8"
        width="full"
        icon-size="3xs"
        searchable
      />
      <Input
        :disabled="!control.enabled"
        :model-value="control.data?.number"
        :focus="false"
        @update:modelValue="onInput"
        type="tel"
        class="rounded-l-none focus:outline-none"
      />
    </div>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import { and, isStringControl, optionIs } from "@jsonforms/core";

// --- internal
import { countries } from "country-data";

// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";
import { Combobox, type ComboboxItemProps } from "../../../combobox";

// --- utils
import { useUpwindRenderer, replaceClassNames } from "../utils";
import { get, isEmpty } from "lodash-es";
import { ringClasses, invalidRingClasses } from "../../../input/input.config";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();
const countryItems = computed<ComboboxItemProps[]>(() =>
  countries.all
    .filter(country => !isEmpty(get(country, "countryCallingCodes")))
    .map(country => ({
      label: country.name,
      selectedLabel: country.countryCallingCodes[0],
      tag: country.countryCallingCodes[0],
      value: `${country.name}||${country.countryCallingCodes[0]}`,
    }))
);

const selectedCountry = ref("");

const containerClasses = computed(() =>
  replaceClassNames([ringClasses, invalidRingClasses], { visible: "within" })
);

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const delegatedProps = computed(() => {
  const options = get(appliedOptions.value, "options", {});

  return {
    id: control.value.id,
    name: control.value.path,
    errors: control.value.errors,
    // ---
    label: control.value.label,
    description: control.value.description,
    // ---
    required: control.value.required,
    disabled: !control.value.enabled,
    visible: control.value.visible,
    ...options,
  };
});
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isStringControl, optionIs("format", "phone")),
};
</script>
