<template>
  <FormField v-bind="formFieldProps">
    <InputPassword
      :model-value="control.data"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :auto-focus="appliedOptions?.autoFocus"
      :maxlength="appliedOptions?.maxLength"
      :minlength="appliedOptions?.minLength"
      :pattern="appliedOptions?.pattern"
      :readonly="appliedOptions?.readonly"
      :required="appliedOptions?.required"
      :disabled="appliedOptions?.disabled"
      :generator="isNewPassword"
      :generate-label="appliedOptions?.generate"
      :show-label="appliedOptions?.show"
      :hide-label="appliedOptions?.hide"
      @update:modelValue="onInput"
      @generate="onGenerate"
    />

    <template v-if="showMeter || errorMessage" #messages>
      <PasswordStrength
        :show-bars="showMeter"
        :score="score"
        :max="requirementsCount"
        :message="errorMessage || (showMeter ? appliedOptions?.hint : '')"
        :has-error="!!errorMessage"
      />
    </template>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { isStringControl, and, or, optionIs, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
// --- components
import { InputPassword, PasswordStrength } from "../../../input-password";
import FormField from "../../FormField.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
import {
  generateStrongPassword,
  getPasswordErrorKey,
  scorePassword
} from "../../../../utils/password";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const isNewPassword = computed(
  () => appliedOptions.value?.autocomplete === "new-password"
);

const requirements = computed<Record<string, string> | undefined>(
  () => appliedOptions.value?.requirements
);
const showMeter = computed(() => isNewPassword.value && !!control.value?.data);

const requirementsCount = computed(
  () => Object.keys(requirements.value ?? {}).length || 4
);
const score = computed(() => scorePassword(control.value?.data));

const errorMessage = computed(() => {
  if (!formFieldProps.value?.touched || !requirements.value) return "";
  const key = getPasswordErrorKey(requirements.value, control.value?.data);
  return key ? (appliedOptions.value?.error?.[key] ?? "") : "";
});

function onGenerate() {
  const minLength = control.value?.schema?.minLength ?? 16;
  onInput(generateStrongPassword(Math.max(minLength, 16), requirements.value));
}
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(formatIs("password"), optionIs("type", "password"))
  )
};
</script>
