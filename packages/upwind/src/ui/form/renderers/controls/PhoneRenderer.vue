<template>
  <FormField v-bind="delegatedProps">
    <InputGroup class="flex">
      <Combobox
        :model-value="control.data?.country || defaultCountryCode"
        @update:modelValue="onCountyInput"
        :items="countryItems"
        class="!w-28 rounded-r-none border-r-0 text-sm !text-opacity-50"
        popover-class="!w-72"
        width="full"
        icon-size="3xs"
        :search="onSearch"
        align="start"
        side="bottom"
      />
      <Input
        :disabled="!control.enabled"
        :model-value="control.data?.number"
        @update:modelValue="onPhoneInput"
        type="tel"
        class="rounded-l-none focus:outline-none"
      />
    </InputGroup>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { countries } from "country-data";

// --- components
import FormField from "../../FormField.vue";
import InputGroup from "../../../groups/InputGroup.vue";
import { Input } from "../../../input";
import { Combobox, type ComboboxItemProps } from "../../../combobox";

// --- utils
import { useUpwindRenderer } from "../utils";
import { get, isEmpty, filter, includes, isString } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { PhoneNumber, CountryCode } from "libphonenumber-js";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const countryItems = computed<ComboboxItemProps[]>(() =>
  countries.all
    .filter(country => !isEmpty(get(country, "countryCallingCodes")))
    .map(country => ({
      avatar: { icon: country.alpha2.toLowerCase() },
      label: country.name,
      selectedLabel: country.countryCallingCodes[0],
      tag: country.countryCallingCodes[0],
      value: country.alpha2,
    }))
);

function onSearch(value: string): ComboboxItemProps[] {
  return filter(
    countryItems.value,
    country =>
      includes(country.label?.toLowerCase(), value.toLowerCase()) ||
      includes(country.selectedLabel?.toLowerCase(), value.toLowerCase()) ||
      includes(country.value?.toLowerCase(), value.toLowerCase())
  );
}

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const phone = ref({ ...control.value.data });

function parsePhone(value: string | PhoneNumber, countryCode: CountryCode) {
  const phonenumber = isString(value)
    ? value
    : value?.nationalNumber || value?.number || "";

  const parsed = parsePhoneNumber(
    phonenumber,
    countryCode || defaultCountryCode
  );
  return parsed;
}

const onCountyInput = (value: string) => {
  phone.value = parsePhone(phone.value, value as CountryCode);
  onInput(phone.value);
};

const onPhoneInput = (value: string | number) => {
  phone.value = parsePhone(value as string, phone.value?.country);
  onInput(phone.value);
};

const defaultCountryCode = get(control.value.schema, "isPhoneNumber");

const delegatedProps = computed(() => {
  const options = appliedOptions.value || {};

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
