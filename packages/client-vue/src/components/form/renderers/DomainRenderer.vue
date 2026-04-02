<template>
  <FormField
    v-bind="formFieldProps"
    :errors="defaultsDeep(formFieldProps.errors, domainErrors)"
    :optional-text="t('text.optional')"
    no-errors
  >
    <SmartDomainField
      :model-value="control.data"
      :required="effectiveRequired"
      :disabled="formFieldProps.disabled"
      :errors="defaultsDeep(formFieldProps.errors, domainErrors)"
      :touched="formFieldProps.touched"
      @update:modelValue="onDomainInput"
      @error="onError"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import SmartDomainField from "../../../modules/domain/SmartDomainField.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();
const domainErrors = ref<string[]>([]);

const { t } = useI18n();

const { control, formFieldProps, onInput, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props),
  (value: string) => trim(value)
);

// --- Schema-based skip gating
const schemaSupportsNull = computed(() => {
  const schema = control.value.schema;
  if (!schema) return false;

  // 1. Direct type array: { "type": ["string", "null"] }
  if (isArray(schema.type) && includes(schema.type, "null")) return true;

  // 2. OpenAPI 3.0 nullable: { "type": "string", "nullable": true }
  if ((schema as any).nullable === true) return true;

  // 3. oneOf/anyOf composition
  const composites = [
    ...((schema as any).oneOf || []),
    ...((schema as any).anyOf || [])
  ];
  if (some(composites, (sub: any) => sub?.type === "null")) return true;

  return false;
});

const effectiveRequired = computed(() => {
  if (formFieldProps.value.required === false && !schemaSupportsNull.value) {
    if (import.meta.env.DEV) {
      console.warn(
        `[DomainRenderer:${control.value.path}] skip suppressed: required=false but schema type does not include null.`,
        "\n  Schema type:",
        control.value.schema?.type,
        '\n  Fix: add "type": ["string", "null"] to the domain field schema, or set nullable: true.'
      );
    }
    return true;
  }
  return formFieldProps.value.required;
});

// --- Null-safe input handler
const onDomainInput = (value: any, isTouched = true) => {
  if (value === null && formFieldProps.value.required === false) {
    // Skip selected — bypass onInput's isNil guard and trim transformer.
    handleChange(control.value.path, null);
    return;
  }
  onInput(value, isTouched);
};

const onError = (error: string) => {
  domainErrors.value = error ? [error] : [];
};
</script>

<script lang="ts">
import { uiTypeIs, and, optionIs, or, schemaMatches } from "@jsonforms/core";
import { defaultsDeep, includes, isArray, some, trim } from "lodash-es";
import { ref } from "vue";

export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    or(
      optionIs("semantic_type", "domain_name"),
      optionIs("semantic_type", "domain-name"),
      schemaMatches(schema =>
        includes(["domain_name", "domain-name"], (schema as any).semantic_type)
      )
    )
  )
};
</script>
