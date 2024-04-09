<template>
  <form
    :class="styles.root"
    :disabled="meta.isProcessing"
    @submit.prevent="doSubmit"
  >
    <slot v-if="loading" name="loading" v-bind="{ styles: styles.loading }">
      <upw-spinner :class="styles.loading" class="loading" />
    </slot>

    <json-forms
      v-if="!meta.isLoading"
      :ajv="ajv"
      :data="model"
      :schema="schema"
      :uischema="uischema"
      :renderers="renderers"
      :validationMode="safeMode"
      :additionalErrors="additionalErrors"
      @change="onChange"
      :class="[
        styles.content.root,
        meta.isProcessing ? styles.content.processing : '',
      ]"
    />

    <!-- actions -->

    <div v-if="!actions && !meta.isLoading" :class="styles.actions.root">
      <slot name="actions" v-bind="{ meta, doReject, doResolve: doSubmit }">
        <upw-button
          type="submit"
          :class="styles.actions.button"
          :disabled="!meta.isValid || meta.isProcessing"
          color="primary"
        >
          Save
        </upw-button>

        <upw-button
          :disabled="meta.isProcessing"
          :class="styles.actions.button"
          @click="doReject"
          variant="ghost"
        >
          Cancel
        </upw-button>
      </slot>
    </div>
  </form>
</template>

<script lang="ts">
// --- global
import { defineComponent, unref, toRaw } from "vue";

import type { Ajv, ErrorObject } from "ajv";

// --- components
import { JsonForms } from "@jsonforms/vue";
import UpwButton from "../button/Button.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config";
import { prelineRenderers } from "./renderers";

// --- utils
import { useStyles, isDeepEmpty } from "../../utils";
import { isEqual } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import type {
  ValidationMode,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core";

// ----------------
export default defineComponent({
  name: "UpwForm",
  components: {
    JsonForms,
    UpwButton,
    UpwSpinner,
  },

  inheritAttrs: true,

  props: {
    ajv: {
      required: false,
      type: Object as PropType<Ajv>,
      default: undefined,
    },
    schema: {
      type: Object as PropType<JsonSchema>,
    },
    uischema: {
      type: Object as PropType<UISchemaElement>,
    },
    modelValue: {
      type: Object,
    },
    // ---
    actions: {
      type: Object as PropType<Record<string, Object>>,
      // default: () => {
      //   submit:{
      //     label:"Save",
      //     color:"primary",
      //     action: ()=>

      //   },
      //   reset:{}
      // },
    },
    // ---

    loading: {
      type: Boolean,
      default: false,
    },
    processing: {
      type: Boolean,
      default: false,
    },
    mode: {
      required: false,
      type: String as PropType<ValidationMode>,
      default: "ValidateAndShow", // ||  "ValidateAndHide" || "NoValidation"
    },
    additionalErrors: {
      type: Array as PropType<
        ErrorObject<string, Record<string, any>, unknown>[]
      >,
      default: () => [],
    },
  },

  watch: {
    modelValue: {
      handler(value) {
        this.model = toRaw(unref(value)) || {};
      },
      immediate: true,
      deep: true,
    },
  },

  emits: ["reject", "resolve", "update:modelValue", "valid"],

  customOptions: {},

  setup(props) {
    return {
      renderers: Object.freeze(prelineRenderers),
      styles: useStyles("form", config),
    };
  },
  data: () => ({
    model: {},
    errors: [],
    isDirty: false,
  }),

  computed: {
    meta() {
      return {
        isLoading: this.loading,
        isProcessing: this.processing,
        isDirty: this.isDirty,
        isValid: !this.errors?.length,
      };
    },

    safeMode() {
      // only show errors if we have some data,, prevents ugly errors on first load
      return isDeepEmpty(this.model) || !this.isDirty
        ? "ValidateAndHide"
        : this.mode || "ValidateAndShow";
    },
  },

  methods: {
    onChange({ data, errors }: JsonFormsChangeEvent) {
      this.errors = errors;

      data ??= {};
      this.model ??= {};
      // finally check if the data has actually changed and emit the update event
      // this json parse/stringify is a hack to do a deep compare and ignore functions/reactivity
      const rawData = JSON.parse(JSON.stringify(data));
      const rawModel = JSON.parse(JSON.stringify(this.model));

      if (!isEqual(rawData, rawModel)) {
        this.model = data;
        this.$emit("update:modelValue", this.model);
        this.isDirty = true;
      }

      this.$emit("valid", !this.errors?.length);
    },

    doSubmit() {
      this.$emit("resolve", this.model);
      this.isDirty = false;
    },

    doReject() {
      this.$emit("reject");
      this.model = {};
      this.isDirty = false;
    },
  },
});
</script>
