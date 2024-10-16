<template>
  <FormField v-bind="delegatedProps">
    <div class="group flex w-full" :class="containerClasses">
      <Combobox
        @update:modelValue="onCountyInput"
        :model-value="control.data?.country"
        :items="countryItems"
        class="!w-28 rounded-r-none border-r-0 text-sm !text-opacity-50"
        popover-class="!w-72 ml-8"
        width="full"
        icon-size="3xs"
        searchable
        :filter-function="filterFunction"
        emit-value
      />
      <Input
        :disabled="!control.enabled"
        :model-value="control.data?.number"
        @update:modelValue="onPhoneInput"
        type="tel"
        class="rounded-l-none focus:outline-none"
      />
    </div>

    <!-- Avoid purge -->
    <span
      class="ring-invalid hidden ring-2 ring-ring ring-offset-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
    ></span>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- internal
import { countries } from "country-data";

// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";
import { Combobox, type ComboboxItemProps } from "../../../combobox";

// --- utils
import { useUpwindRenderer, replaceClassNames } from "../utils";
import { get, isEmpty, set } from "lodash-es";
import { ringClasses, invalidRingClasses } from "../../../input/input.config";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

defineOptions({
  name: "PhoneRenderer",
});

const props = defineProps<RendererProps<ControlElement>>();
const countryItems = computed<ComboboxItemProps[]>(() =>
  countries.all
    .filter(country => !isEmpty(get(country, "countryCallingCodes")))
    .map(country => ({
      label: country.name,
      selectedLabel: country.countryCallingCodes[0],
      tag: country.countryCallingCodes[0],
      value: country.alpha2,
    }))
);

const filterFunction = (list: ComboboxItemProps[], term: string) => {
  return list.filter(country => {
    return (
      country.label.toLowerCase().includes(term.toLowerCase()) ||
      country.selectedLabel.toLowerCase().includes(term.toLowerCase()) ||
      country.value.toLowerCase().includes(term.toLowerCase())
    );
  });
};

const containerClasses = computed(() =>
  replaceClassNames([ringClasses, invalidRingClasses], { visible: "within" })
);

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const phone = ref({ ...control.value.data });
const onCountyInput = (value: ComboboxItemProps) => {
  set(phone.value, "country", value);
  onInput({
    ...phone.value,
    currentTarget: { value: phone.value },
  });
};

const onPhoneInput = (value: string | number) => {
  set(phone.value, "number", value);
  onInput({
    ...phone.value,
    currentTarget: { value: phone.value },
  });
};

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
import { and, isObjectControl, schemaMatches } from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(
    isObjectControl,
    schemaMatches(schema => !!schema?.isPhoneNumber)
  ),
};
</script>
