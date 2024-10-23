<template>
  <FormField v-bind="delegatedProps">
    <InputGroup class="flex">
      <Autocomplete
        :model-value="control.data?.country || defaultCountryCode"
        @update:modelValue="onCountyInput"
        :display-value="
          v => {
            console.log(v);
            return typeof v === 'string' && v.includes('-')
              ? v.split('-')[0]
              : v;
          }
        "
        :items="countryItems"
        class="rounded-r-none border-r-0 text-sm !text-opacity-50"
        width="2xs"
        dropdown-width="lg"
        icon-size="3xs"
        :search="onSearch"
        align="start"
        side="bottom"
      >
        <template #prepend>
          <Icon icon="plus" size="xs" class="-mr-0.5 opacity-50" />
        </template>
      </Autocomplete>
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

// --- internal
import { countries } from "country-data";

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
import { get, isEmpty, filter, includes, isString } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { PhoneNumber, CountryCode } from "libphonenumber-js";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const countryItems = computed<AutocompleteItemProps[]>(() =>
  countries.all
    .filter(country => !isEmpty(get(country, "countryCallingCodes")))
    .map(country => ({
      avatar: { icon: country.alpha2.toLowerCase() },
      label: country.name,
      selectedLabel: country.countryCallingCodes[0],
      tag: country.countryCallingCodes[0],
      value:
        country.countryCallingCodes[0].replace("+", "") + "-" + country.alpha2,
    }))
);

function onSearch(value: string): AutocompleteItemProps[] {
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

const onCountyInput = (value: string) => {
  phone.value = { country: value.split("-")[0], number: phone.value.number };
  onInput(phone.value);
};

const onPhoneInput = (value: string | number) => {
  phone.value = { country: phone.value.country, number: value };
  onInput(phone.value);
};

const getCountryCallingCode = (countryCode: CountryCode) => {
  return countries.all
    .find(country => country.alpha2 === countryCode)
    ?.countryCallingCodes[0].replace("+", "");
};

const defaultCountryCode = getCountryCallingCode(
  get(control.value.schema, "isPhoneNumber")
);

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
