<template>
  <FormField v-bind="formFieldProps" no-errors>
    <InputGroup class="flex">
      <Combobox
        :model-value="
          phone?.country || control.data?.country || defaultCountryCode
        "
        :items="countryItems"
        @update:modelValue="onCountyInput"
        class="rounded-r-none border-r-0 text-sm !text-opacity-50 !ring-0"
        popover-class="!w-dropdown-xl"
        align="start"
        width="xs"
        :checked-icon="false"
        :search="onSearch"
        tabindex="-1"
      />
      <Input
        :disabled="!control.enabled"
        :default-value="
          phone?.nationalNumber ||
          control.data?.nationalNumber ||
          control.data?.number
        "
        :placeholder="exampleNumber || ''"
        @update:modelValue="onPhoneInput"
        type="tel"
        class="rounded-l-none focus:outline-none"
      />
    </InputGroup>

    <template #messages>
      <FormMessage
        v-if="formFieldProps.touched && errors"
        :errors="[errorsMapped]"
        :formMessageId="`form-item-message-${control.id}`"
        :name="control.path"
      />
    </template>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import examples from "libphonenumber-js/mobile/examples";
import {
  getExampleNumber,
  validatePhoneNumberLength,
  parsePhoneNumberWithError,
  ParseError
} from "libphonenumber-js";

// --- internal
import { countries, getCountryCode } from "countries-list";

// --- components
import FormField from "../../FormField.vue";
import FormMessage from "../../FormMessage.vue";
import InputGroup from "../../../groups/InputGroup.vue";
import { Input } from "../../../input";
import { Combobox } from "../../../combobox";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import {
  get,
  map,
  includes,
  filter,
  isString,
  first,
  isEmpty,
  has
} from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { PhoneNumber, CountryCode } from "libphonenumber-js";
import type { ComboboxItemProps } from "../../../combobox";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

// --- utils

const initialPhoneData = () => {
  const data = control.value.data;

  // Parsing E.164 string format
  if (isString(data) && data.startsWith("+")) {
    try {
      const parsed = parsePhone(data);
      return parsed;
    } catch (error) {
      console.warn("Failed to parse E.164 format phone number:", error);
      return {};
    }
  }

  return data;
};

// --- state

const defaultCountryCode = get(control.value.schema, "phone_country_code");
const requiresString = includes(control.value.schema.type, "string");
const phone = ref(initialPhoneData());

// --- context

const exampleNumber = computed(() => {
  const countryCode = phone.value?.country || defaultCountryCode;
  return getExampleNumber(countryCode, examples)?.formatNational();
});

const errors = computed(() => {
  if (!isEmpty(formFieldProps?.value?.errors)) {
    try {
      parsePhoneNumberWithError(phone.value.number, {
        defaultCountry: phone?.value?.country
      });
      return (
        validatePhoneNumberLength(phone.value.number, {
          defaultCountry: phone.value.country
        }) || "NOT_A_NUMBER"
      );
    } catch (error) {
      return (error as ParseError).message;
    }
  }
});

const errorsMapped = computed(() => {
  switch (errors.value) {
    case "TOO_LONG":
      return "Phone number is too long";
    case "TOO_SHORT":
      return "Phone number is too short";
    case "INVALID_COUNTRY":
      return "Invalid country";
    default:
      return (
        (first(formFieldProps.value.errors) as string) || "Not a phone number"
      );
  }
});

const countryItems = computed(() => {
  return map(countries, country => {
    const countryCode = getCountryCode(country.name) as string;
    return {
      avatar: { icon: countryCode?.toLowerCase() },
      label: country.name,
      selectedLabel: `+${country.phone.join(", +")}`,
      tag: `+${country.phone.join(", +")}`,
      value: countryCode?.toUpperCase(),
      selected: countryCode === phone.value?.country
    };
  }) as ComboboxItemProps[];
});

// --- methods

function parsePhone(
  value: string | PhoneNumber,
  countryCode?: CountryCode
): {
  country: CountryCode;
  number: string;
  nationalNumber?: string;
  countryCallingCode?: string;
} {
  const phonenumber = isString(value)
    ? value
    : value?.nationalNumber || value?.number || "";

  const code = countryCode ?? defaultCountryCode;

  let parsed;
  try {
    parsed = parsePhoneNumberWithError(phonenumber, code);
  } catch (error) {
    // do nothing, we will return the original value
  }

  if (parsed) {
    return {
      number: parsed.number,
      nationalNumber: parsed.nationalNumber,
      countryCallingCode: parsed.countryCallingCode,
      country: code!
    };
  }

  return { country: code!, number: phonenumber };
}

function onCountyInput(value: any) {
  phone.value = parsePhone(phone.value?.nationalNumber, value as CountryCode);
  onInput(
    requiresString ? phone.value.number : phone.value,
    !isEmpty(phone.value) // NB only set touched IF we also have a phone number
  );
}

function onPhoneInput(value: string | number) {
  try {
    phone.value = parsePhone(value as string, phone.value?.country);
    onInput(
      requiresString ? phone.value.number : phone.value,
      !isEmpty(phone.value) // NB only set touched IF we also have a phone number
    );
  } catch (error) {
    // We don't want to spam the console with errors
  }
}

function onSearch(value: string): ComboboxItemProps[] {
  return filter(
    countryItems.value,
    (item: ComboboxItemProps): boolean =>
      !!(
        includes(item.label.toLowerCase(), value.toLowerCase()) ||
        includes(item.value.toLowerCase(), value.toLowerCase()) ||
        (item.tag && includes(item.tag, value))
      )
  );
}
</script>

<script lang="ts">
import {
  and,
  isStringControl,
  isObjectControl,
  schemaMatches,
  or,
  formatIs
} from "@jsonforms/core";

export const tester = {
  rank: 10,
  controlType: and(
    or(isStringControl, isObjectControl),
    or(
      formatIs("phone"),
      schemaMatches(schema => schema.format === "international_phone"),
      schemaMatches(schema => has(schema, "phone_country_code"))
    )
  )
};
</script>
