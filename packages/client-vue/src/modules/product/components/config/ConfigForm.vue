<template>
  <FormField
    v-if="hasFields"
    :class="styles.product.config.form.root"
    :label="label"
    :disabled="disabled"
    required
    id="product-config-form"
    name="product-config-form"
  >
    <Form
      :locale="locale"
      :translator="t"
      :schema="fields"
      :model-value="modelValue"
      :additional-errors="additionalErrors"
      :touched="touched"
      :additional-renderers="formRenderers"
      @update:modelValue="doResolve"
      no-actions
      as="fieldset"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../../product.config";
import { formRenderers } from "../../../../components/form";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import Form from "../../../../components/form/Form.vue";

// --- utils
import { isEmpty } from "lodash-es";

// ---types
import type { ComputedRef } from "vue";

const emit = defineEmits<{
  (e: "update:modelValue", model: any): void;
}>();

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    processing?: boolean;
    touched?: boolean;
    fields: any;
    modelValue: any;
    additionalErrors?: any[];
    label?: string;
  }>(),
  {
    disabled: false,
    loading: false,
    processing: false,
    touched: false,
    additionalErrors: () => [],
    label: "",
  }
);

// -----------------------------------------------------------------------------

const { t, locale } = useI18n();

const styles = useStyles(
  ["product.config.form"],
  props,
  config
) as ComputedRef<{
  product: {
    config: {
      form: {
        root: string;
      };
    };
  };
}>;

const hasFields = computed(() => {
  return !isEmpty(props.fields?.properties);
});

function doResolve(model: any) {
  if (props.disabled) return;
  emit("update:modelValue", model);
}
</script>
