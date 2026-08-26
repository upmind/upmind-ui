<template>
  <FormField v-bind="formFieldProps" no-errors>
    <Input
      :size="appliedOptions?.size"
      class="flex"
      :auto-focus="appliedOptions?.autoFocus"
      :mask="phoneMask"
      :disabled="!control.enabled"
      :model-value="
        phone?.nationalNumber ||
        control.data?.nationalNumber ||
        control.data?.number
      "
      :placeholder="exampleNumber || ''"
      type="tel"
      autocomplete="tel-national"
      @update:model-value="onPhoneInput"
    >
      <template #prefix>
        <Combobox
          class="w-32"
          :anchor-data-attrs="{ 'data-test-key': 'button-phone-country' }"
          :items="countryItems"
          :model-value="
            phone?.country || control.data?.country || defaultCountryCode
          "
          :display-value="countryDisplay"
          :empty-label="t('text.no_results')"
          :ui="{ content: 'w-80' }"
          open-on-focus
          reset-search-term-on-blur
          :tabindex="-1"
          @update:model-value="onCountyInput"
        >
          <template #prefix>
            <Icon
              v-if="selectedFlag"
              :icon="selectedFlag"
              class="size-4 shrink-0"
            />
          </template>
          <template #item="{ option }">
            <Icon
              v-if="option.avatar?.icon"
              :icon="option.avatar.icon"
              class="size-4 shrink-0"
            />
            <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
            <span class="text-muted">{{ option.tag }}</span>
          </template>
        </Combobox>
      </template>
    </Input>

    <template #messages>
      <FormMessage
        v-if="formFieldProps.touched && errors"
        :errors="[errorsMapped]"
        :formMessageId="`form-item-message-${control.id}`"
        :data-test-key="`form-item-message-phone`"
        :name="control.path"
      />
    </template>
  </FormField>
</template>

<script lang="ts" setup>
import {
  and,
  isStringControl,
  isObjectControl,
  schemaMatches,
  or,
  formatIs
} from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { Combobox, Input } from "@upmind/ui";
import {
  getExampleNumber,
  validatePhoneNumberLength,
  parsePhoneNumberWithError
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useSystem } from "@upmind-automation/headless";
import { Icon } from "../../../../icon";
import FormField from "../../FormField.vue";
import FormMessage from "../../FormMessage.vue";
import { useUpmindUIRenderer } from "../utils";
import { get, map, includes, isString, first, isEmpty, has } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { PhoneNumber, CountryCode, ParseError } from "libphonenumber-js";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));
const { t } = useI18n();
const { countries, ensureCountries } = useSystem();
ensureCountries();
// --- utils

const initialPhoneData = () => {
  const data = control.value.data;
  // Parsing E.164 string format
  if (isString(data) && data.startsWith("+")) {
    try {
      return parsePhone(data);
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

const selectedFlag = computed(() =>
  (phone.value?.country || defaultCountryCode)?.toLowerCase()
);

const exampleNumber = computed(() => {
  const countryCode = phone.value?.country || defaultCountryCode;
  const example = getExampleNumber(countryCode, examples);
  if (!example) return undefined;
  // Format national number without trunk prefix (leading 0)
  const formatted = example.formatNational();
  const national = example.nationalNumber;
  const digitsOnly = formatted.replace(/\D/g, "");
  const trunkDigits = digitsOnly.length - national.length;
  if (trunkDigits <= 0) return formatted;
  let digitCount = 0;
  let skipIndex = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) digitCount++;
    if (digitCount > trunkDigits) {
      skipIndex = i;
      break;
    }
  }
  return formatted.slice(skipIndex);
});

const phoneMask = computed(() => {
  if (!exampleNumber.value) return undefined;
  return exampleNumber.value.replace(/\d/g, "0");
});

const errors = computed(() => {
  if (isEmpty(formFieldProps?.value?.errors)) return undefined;
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

const countryItems = computed(() =>
  map(countries.value, country => ({
    avatar: { icon: country.code.toLowerCase() },
    label: country.name,
    tag: `+${country.phone_code}`,
    value: country.code.toUpperCase()
  }))
);

// The trigger shows the dial code for the selected country.
function countryDisplay(value: unknown) {
  return countryItems.value.find(item => item.value === value)?.tag ?? "";
}
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
  const code =
    (value as PhoneNumber)?.country ?? countryCode ?? defaultCountryCode;

  let parsed;
  try {
    parsed = parsePhoneNumberWithError(phonenumber, code);
  } catch (_error) {
    // do nothing, we will return the original value
  }

  if (parsed) {
    return {
      number: parsed.number,
      nationalNumber: parsed.nationalNumber,
      countryCallingCode: parsed.countryCallingCode,
      country: parsed?.country || code!
    };
  }
  return { country: code!, number: phonenumber };
}

function onCountyInput(value: unknown) {
  phone.value = parsePhone(phone.value?.nationalNumber, value as CountryCode);
  onInput(
    requiresString ? phone.value.number : phone.value,
    !isEmpty(phone.value)
  );
}

function onPhoneInput(value: string | number | undefined) {
  if (value === undefined) return;
  try {
    phone.value = parsePhone(value as string, phone.value?.country);
    onInput(
      requiresString ? phone.value.number : phone.value,
      !isEmpty(phone.value)
    );
  } catch (_error) {
    // We don't want to spam the console with errors
  }
}
</script>

<script lang="ts">
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
