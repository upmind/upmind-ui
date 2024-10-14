<template>
  <upw-input
    v-if="hasFields"
    :class="styles.product.config.form.root"
    :label="label"
    :disabled="disabled"
    :required="true"
    no-required
    no-feedback
    no-status
    variant="flat"
    layout="stacked"
  >
    <upw-form
      :locale="$i18n.locale"
      :translator="$t"
      :schema="fields"
      :model-value="modelValue"
      :additional-errors="additionalErrors"
      :additional-renderers="additionalRenderers"
      @update:modelValue="doResolve"
      no-actions
      as="fieldset"
    />
  </upw-input>
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind-automation/upwind";
import config from "./config.cva";
import { additionalRenderers } from "../renderers";
// --- components
import { UpwForm, UpwInput } from "@upmind-automation/upwind";

// --- utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmProductConfigForm",
  components: { UpwForm, UpwInput },
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
    const styles = useStyles(["product.config.form"], toRefs(props), config);

    return {
      styles,
      mergeStyles,
      additionalRenderers,
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
