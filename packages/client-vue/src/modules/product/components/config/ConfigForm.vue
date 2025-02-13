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
      :additional-renderers="formRenderers"
      @update:modelValue="doResolve"
      no-actions
      as="fieldset"
    />
  </FormField>
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../config.cva";
import { formRenderers } from "../../../../components/form";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import Form from "../../../../components/form/Form.vue";

// --- utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "ProductConfigForm",
  components: { Form, FormField },
  emits: ["update:modelValue"],
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    processing: {
      type: Boolean,
      default: false,
    },
    fields: {
      type: Object,
      required: true,
    },
    modelValue: {
      type: Object,
      required: true,
    },
    additionalErrors: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {
    const { t, locale } = useI18n();

    const styles = useStyles(["product.config.form"], toRefs(props), config);

    return {
      locale,
      t,

      styles,
      cn,
      formRenderers,
    };
  },
  computed: {
    hasFields() {
      return !isEmpty(this.fields?.properties);
    },
  },
  methods: {
    doResolve(model) {
      if (this.disabled) return;
      this.$emit("update:modelValue", model);
    },
  },
});
</script>
