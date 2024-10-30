<template>
  <FormField v-bind="formFieldProps">
    <InputGroup class="flex">
      <Autocomplete
        :display-value="displayValue"
        :items="countryItems"
        :model-value="control.data?.country || defaultCountryCode"
        :search="onSearch"
        @update:model-value="onCountyInput"
        align="start"
        class="rounded-r-none border-r-0 text-sm !text-opacity-50"
        dropdown-width="lg"
        icon-size="3xs"
        item-label="label"
        item-value="value"
        side="bottom"
        width="3xs"
        popover-width="lg"
      >
        <template #prepend>
          <Icon icon="plus" size="xs" class="-mr-0.5 opacity-50" />
        </template>
      </Autocomplete>
      <Input
        :disabled="!control.enabled"
        :model-value="control.data?.nationalNumber || control.data?.number"
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
import { countries, getCountryCode } from "countries-list";

// --- components
import FormField from "../../FormField.vue";
import InputGroup from "../../../groups/InputGroup.vue";
import { Input } from "../../../input";
import {
  Autocomplete,
  type AutocompleteItemProps,
} from "../../../autocomplete";
import { Icon } from "../../../icon";

// --- utils
import { useUpwindRenderer } from "../utils";
import { get, map, trimStart, includes, filter, isString } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ICountry } from "countries-list";
import type { PhoneNumber, CountryCode } from "libphonenumber-js";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const countryItems = computed<AutocompleteItemProps[]>(() =>
  map(countries, (country: ICountry) => {
    const countryCode = getCountryCode(country.name) as string;
    return {
      avatar: { icon: countryCode?.toLowerCase() },
      label: country.name,
      tag: `+${country.phone.join(", +")}`,
      value: countryCode?.toUpperCase(),
    };
  })
);

const { control, formFieldProps, onInput } = useUpwindRenderer(
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

  if (!parsed) {
    return { country: countryCode, number: phonenumber };
  }
  return parsed;
}

function onCountyInput(value: any) {
  phone.value = parsePhone(phone.value, value as CountryCode);
  onInput(phone.value);
}

function onPhoneInput(value: string | number) {
  phone.value = parsePhone(value as string, phone.value?.country);
  onInput(phone.value);
}

async function onSearch(value: string) {
  return filter(
    countryItems.value,
    (item: AutocompleteItemProps) =>
      includes(item.label.toLowerCase(), value.toLowerCase()) ||
      includes(item.value.toLowerCase(), value.toLowerCase()) ||
      includes(item.tag, value.toLowerCase())
  );
}

function displayValue(item: any) {
  const label = trimStart(item?.tag, "+");
  return label;
}

const defaultCountryCode = get(control.value.schema, "isPhoneNumber");
</script>

<script lang="ts">
import { and, isObjectControl, schemaMatches } from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(
    isObjectControl,
    schemaMatches(
      schema => "isPhoneNumber" in schema && !!(schema as any).isPhoneNumber
    )
  ),
};
</script>
