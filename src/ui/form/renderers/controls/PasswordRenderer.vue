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

    <template v-if="showMessages" #messages>
      <PasswordStrength
        :show-bars="showMeter"
        :score="score"
        :max="requirementsCount"
        :message="message"
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
  FALLBACK_REQUIREMENT_COUNT,
  generateStrongPassword,
  getPasswordErrorKey,
  scorePassword
} from "../../../../utils/password";
import { keys, size } from "lodash-es";
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
// Show the meter once the user starts typing — keeps the resting state quiet
// while still surfacing live feedback during input.
const showMeter = computed(() => isNewPassword.value && !!control.value?.data);

const requirementsCount = computed(
  () => size(keys(requirements.value)) || FALLBACK_REQUIREMENT_COUNT
);
const score = computed(() =>
  scorePassword(control.value?.data, requirements.value)
);

// True when every configured requirement is satisfied (or when there are no
// requirements to check). Used to suppress the hint once the user has
// successfully met all rules — the filled meter is feedback enough.
const isValid = computed(
  () =>
    !requirements.value ||
    !getPasswordErrorKey(requirements.value, control.value?.data)
);

const errorMessage = computed(() => {
  if (!formFieldProps.value?.touched || !requirements.value) return "";
  const key = getPasswordErrorKey(requirements.value, control.value?.data);
  return key ? (appliedOptions.value?.error?.[key] ?? "") : "";
});

// Resolve the message shown beneath the field:
// 1. Validation error wins when the user has touched the input and a rule is unmet.
// 2. Otherwise the configured `hint` is shown for new-password fields *until*
//    the password is valid — informs the user upfront, then gets out of the way.
const message = computed(() => {
  if (errorMessage.value) return errorMessage.value;
  if (isNewPassword.value && !isValid.value)
    return appliedOptions.value?.hint ?? "";
  return "";
});

// Render the messages slot whenever there's something to show (meter, hint,
// or error) — avoids reserving space when the field is irrelevant (e.g. login).
const showMessages = computed(() => showMeter.value || !!message.value);

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
