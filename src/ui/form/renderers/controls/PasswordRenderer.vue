<template>
  <FormField v-bind="formFieldProps">
    <InputGroup class="relative w-full">
      <Input
        :max="safeMax"
        :min="safeMin"
        :placeholder="appliedOptions?.placeholder"
        :type="unmask ? 'text' : 'password'"
        :autocomplete="appliedOptions?.autocomplete || 'current-password'"
        :auto-focus="appliedOptions?.autoFocus"
        :maxlength="appliedOptions?.maxLength"
        :minlength="appliedOptions?.minLength"
        :pattern="appliedOptions?.pattern"
        :readonly="appliedOptions?.readonly"
        :required="appliedOptions?.required"
        :disabled="appliedOptions?.disabled"
        :model-value="control.data"
        @update:modelValue="onInput"
      >
        <template #append>
          <Tooltip v-if="showGenerator" :label="generateLabel" side="top">
            <Link
              :focusable="false"
              :disabled="appliedOptions?.disabled || appliedOptions?.readonly"
              @click.prevent="onGenerate"
            >
              <Icon icon="magic-wand-02" size="2xs" />
            </Link>
          </Tooltip>

          <Tooltip :label="unmask ? hideLabel : showLabel" side="top">
            <Link
              :class="unmask ? 'opacity-100' : 'opacity-50 hover:opacity-100'"
              :focusable="false"
              @click.prevent="unmask = !unmask"
            >
              <Icon v-if="unmask" icon="eye-off" size="2xs" />
              <Icon v-else icon="eye" size="2xs" />
            </Link>
          </Tooltip>
        </template>
      </Input>
    </InputGroup>

    <template v-if="showStrength" #messages>
      <div v-if="control.data" class="mt-3 space-y-2">
        <div class="flex gap-1">
          <div
            v-for="i in 4"
            :key="i"
            class="h-1 flex-1 rounded-full transition-all duration-300"
            :class="i <= score ? barColorClass : 'bg-skeleton'"
          />
        </div>
        <p
          class="text-sm leading-4 transition-colors duration-200"
          :class="hasError ? 'text-accent-danger' : 'text-muted'"
        >
          {{ errorText || hintLabel }}
        </p>
      </div>
    </template>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { isStringControl, and, or, optionIs, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed, inject, ref } from "vue";
// --- components
import InputGroup from "../../../groups/InputGroup.vue";
import { Icon } from "../../../icon";
import { Input } from "../../../input";
import { Link } from "../../../link";
import { Tooltip } from "../../../tooltip";
import FormField from "../../FormField.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
import { get, includes, isNil, keys, omitBy, sortBy, without } from "lodash-es";
// --- types
import type { ControlElement, JsonFormsSubStates } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const unmask = ref(false);

// --- chrome strings via JSONForms translator (no vue-i18n)
const jsonforms = inject<JsonFormsSubStates>("jsonforms");
const i18nBase = computed(
  () => control.value?.uischema?.i18n ?? "form.auth_password"
);
function translate(key: string, fallback: string): string {
  return (
    jsonforms?.i18n?.translate?.(`${i18nBase.value}.${key}`, fallback) ??
    fallback
  );
}
const generateLabel = computed(() =>
  translate("generate", "Generate a strong password")
);
const showLabel = computed(() => translate("show", "Show password"));
const hideLabel = computed(() => translate("hide", "Hide password"));
const hintLabel = computed(() =>
  translate(
    "hint",
    "Password must be at least 8 characters and include a letter, a number, and a symbol."
  )
);

// --- variant selection (autocomplete heuristic + explicit override)
const showStrength = computed(
  () =>
    appliedOptions.value?.strength ??
    appliedOptions.value?.autocomplete === "new-password"
);
const showGenerator = computed(
  () => appliedOptions.value?.generator ?? showStrength.value
);

// --- strength score (0–4)
function getPasswordStrengthScore(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-zA-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return score;
}
const score = computed(() =>
  getPasswordStrengthScore(control.value?.data ?? "")
);
const barColorClass = computed(
  () =>
    ({
      1: "bg-accent-danger",
      2: "bg-accent-warning",
      3: "bg-accent-warning",
      4: "bg-accent-success"
    })[score.value] ?? "bg-accent-danger"
);

// --- error resolution (widened; deterministic alpha sort)
function getPasswordErrorKey(
  requirements?: Record<string, string>,
  value?: string
): string {
  const unmet = keys(
    omitBy(requirements, (pattern: string) =>
      new RegExp(pattern).test(value ?? "")
    )
  );
  const lengthUnmet = includes(unmet, "min_length");
  const others = sortBy(without(unmet, "min_length"));
  return (
    lengthUnmet ? ["min_length", ...others] : ["missing", ...others]
  ).join("_");
}
const errorText = computed(() => {
  const { requirements, error: messages } = appliedOptions.value ?? {};
  if (!formFieldProps.value?.touched || !requirements) return "";
  return get(
    messages,
    getPasswordErrorKey(requirements, control.value?.data),
    ""
  );
});
const hasError = computed(() => !!errorText.value);

// --- password generator (cryptographically random)
function secureRandom(max: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}
function generateStrongPassword(length: number): string {
  const letters = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%^&*_+-=?";
  const all = letters + digits + symbols;
  const pw = [
    letters[secureRandom(letters.length)],
    digits[secureRandom(digits.length)],
    symbols[secureRandom(symbols.length)]
  ];
  for (let i = pw.length; i < length; i++)
    pw.push(all[secureRandom(all.length)]);
  // Fisher–Yates shuffle using secureRandom (lodash.shuffle uses Math.random)
  for (let i = pw.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}
function onGenerate() {
  const min = control.value?.schema?.minLength ?? 16;
  onInput(generateStrongPassword(Math.max(min, 16)));
  unmask.value = true;
}

// --- min / max
const safeMin: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.min;
  if (!isNil(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (!isNil(minimum)) return minimum;

  return undefined;
});

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.max;
  if (!isNil(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (!isNil(maximum)) return maximum;

  return undefined;
});
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
