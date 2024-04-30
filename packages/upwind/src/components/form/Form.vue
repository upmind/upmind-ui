<template>
  <form
    :class="styles.form.root"
    :disabled="meta.isProcessing"
    @submit.prevent="doSubmit"
  >
    <slot
      v-if="meta.isLoading"
      name="loading"
      v-bind="{ styles: styles.form.spinner }"
    >
      <upw-spinner :class="styles.form.spinner" class="loading" />
    </slot>

    <json-forms
      :i18n="safeI18n"
      :ajv="safeAjv"
      :data="model"
      :schema="schema"
      :uischema="uischema"
      :renderers="renderers"
      :validationMode="safeMode"
      :additionalErrors="additionalErrors"
      @change="onChange"
      :class="styles.form.content"
    />

    <!-- actions -->
    <div v-if="safeActions" :class="styles.form.actions">
      <slot name="actions" v-bind="{ meta, doReject, doResolve: doSubmit }">
        <upw-button
          v-for="(action, key) in safeActions"
          :key="key"
          v-bind="action"
          @click.prevent="doAction(action, $event)"
        />
      </slot>
    </div>
  </form>
</template>

<script lang="ts">
// --- external
import { defineComponent, unref, toRaw, toRefs } from "vue";
import type Ajv from "ajv";

import type { ErrorObject } from "ajv";

// --- components
import { JsonForms } from "@jsonforms/vue";
import UpwButton from "../button/Button.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config.cva";
import { upwindRenderers } from "./renderers";
// import { vanillaRenderers } from '@jsonforms/vue-vanilla';

// --- utils

import { useStyles, isDeepEmpty, useValidation } from "../../utils";
import {
  isArray,
  isEqual,
  isFunction,
  isObject,
  mapValues,
  map,
  isNil,
} from "lodash-es";

function safeValue(value: String | Object | Function, context?: any) {
  if (isObject(value)) return mapValues(value, v => safeValue(v, context));
  if (isArray(value)) return map(value, v => safeValue(v, context));
  if (isFunction(value)) return value(context);
  return value;
}

// --- types
import type { PropType } from "vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import type {
  ValidationMode,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core";

// ----------------------------------------------

export default defineComponent({
  name: "UpwForm",
  components: {
    JsonForms,
    UpwButton,
    UpwSpinner,
  },

  inheritAttrs: true,

  props: {
    translator: {
      type: Function,
    },
    locale: {
      type: String,
    },
    // ---
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
      type: [Boolean, Object] as PropType<
        Boolean | Record<string, { label: string; action: Function }>
      >,
      default: null,
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
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
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
    const { ajv } = useValidation();

    const styles = useStyles(
      ["form", "formButton"],
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      renderers: Object.freeze(upwindRenderers),
      styles,
      safeValue,
      safeAjv: props.ajv || ajv,
    };
  },
  data: () => ({
    model: {},
    errors: [],
    isDirty: false,
  }),

  computed: {
    safeActions() {
      if (isNil(this.actions)) {
        return {
          submit: {
            type: "submit",
            label: "Save",
            // color: "accent",
            variant: "elevated",
            disabled: !this.meta.isValid || this.meta.isProcessing,
            action: () => {
              this?.doSubmit();
            },
          },
          reset: {
            label: "Cancel",
            variant: "ghost",
            // color: "accent",
            disabled: this.meta.isProcessing,
            action: () => {
              this.doReject();
            },
          },
        };
      } else if (this.actions) {
        return safeValue(this.actions, this);
      }
      return null;
    },

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

    safeI18n() {
      // if we are given an i18n object, use it
      // otherwise, if we have vue-i18n enabled, it will provide the$locale & $t function, use that
      // otherwise, return null

      const createTranslator = locale => (key, defaultMessage) => {
        // console.debug(
        //   `Locale: ${locale}, Key: ${key}, Default Message: ${defaultMessage}`
        // );

        // If we have been given a translator function, use it
        if (isFunction(this.translator)) return this.translator(key);

        // otherwise, if we have vue-i18n enabled, it will provide the $locale & $t function, use that
        if (this?.$t) return this?.$t(key);

        // otherwise return the default message
        return defaultMessage;
      };

      return {
        locale: this.locale || this?.$i18n?.locale || "na",
        translate: createTranslator(this.locale || this?.$i18n?.locale),
      };
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

    doAction(item, $event) {
      if (this.meta.isProcessing) {
        $event.preventDefault();
        return;
      }

      if (isFunction(item.action)) {
        item.action(this);
        return;
      }

      if (item.action) {
        this.$emit(item.action);
        return;
      }

      this.$emit("click", item);
    },

    doSubmit() {
      this.$emit("resolve", this.model);
      this.isDirty = false;
    },

    doReject() {
      this.model = {};
      this.isDirty = false;
      this.$emit("update:modelValue", this.model);
      this.$emit("reject");
    },
  },
});
</script>
