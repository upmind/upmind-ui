<template>
  <component
    :is="as"
    :class="styles.form.root"
    :disabled="meta.isProcessing"
    @submit.prevent="doSubmit"
  >
    <slot
      v-if="meta.isLoading"
      name="loading"
      v-bind="{ styles: styles.form.loading }"
    >
      <!-- <upw-skeleton-form :class="styles.form.loading" /> -->
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

    <slot name="footer" v-bind="{ meta }"></slot>

    <!-- actions -->
    <div v-if="safeActions && !noActions" :class="styles.form.actions">
      <slot name="actions" v-bind="{ meta, doReject, doResolve: doSubmit }">
        <u-button
          v-for="(action, key) in safeActions"
          :key="key"
          v-bind="action"
          :loading="action.needsValid && (meta.isProcessing || meta.isLoading)"
          :disabled="
            meta.isProcessing ||
            action?.disabled ||
            (action.needsValid && !meta.isValid)
          "
          block
          class="w-full"
          @click="doAction(action, $event)"
        />
      </slot>
    </div>
  </component>
</template>

<script lang="ts">
// --- external
import { defineComponent, unref, toRaw, toRefs, ref } from "vue";
import type Ajv from "ajv";

import type { ErrorObject } from "ajv";

// --- components
import { iterateSchema } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/vue";

// --- custom elements
import UButton from "../../ui/button/Button.ce.vue";

import UpwSkeletonForm from "../skeleton/SkeletonForm.vue";

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
  includes,
  forEach,
  set,
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
  name: "UwpwForm",
  components: {
    UButton,
    JsonForms,
    UpwSkeletonForm,
  },

  inheritAttrs: false,

  props: {
    as: {
      type: String,
      default: "form",
    },
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
    additionalRenderers: {
      type: Array,
      default: () => [],
    },
    // ---
    actions: {
      type: [Boolean, Object] as PropType<
        Boolean | Record<string, { label: string; action: Function }>
      >,
      default: null,
    },
    noActions: {
      type: Boolean,
      default: false,
    },
    autosave: { type: Boolean },
    // ---
    size: { type: String },
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
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  watch: {
    $props: {
      handler() {
        this.updateUischema();
      },
      immediate: true,
      deep: true,
    },
    modelValue: {
      handler(value) {
        this.model = toRaw(unref(value)) || {};
      },
      immediate: true,
      deep: true,
    },
  },

  emits: ["reject", "resolve", "update:modelValue", "valid", "click"],

  setup(props) {
    const { ajv } = useValidation(props.ajv);

    // ---
    const styles = useStyles(
      ["form", "formButton"],
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      renderers: Object.freeze([
        ...upwindRenderers,
        ...props.additionalRenderers,
      ]),
      styles,
      safeValue,
      safeAjv: ajv,
      // ---
      model: ref({}),
      errors: ref([]),
      isDirty: ref(false),
    };
  },

  computed: {
    safeActions() {
      if (isNil(this.actions)) {
        return {
          submit: {
            type: "submit",
            label: "Save",
            // color: "accent",
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
        return this.actions;
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
        let value = null;
        // console.debug(
        //   `Locale: ${locale}, Key: ${key}, Default Message: ${defaultMessage}`
        // );

        // If we have been given a translator function, use it
        if (isFunction(this.translator)) value = this.translator(key);
        // otherwise, if we have vue-i18n enabled, it will provide the $locale & $t function, use that
        else if (this?.$t) value = this?.$t(key);

        // otherwise return the default message
        if (!value || value == key) value = defaultMessage;

        return value;
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

      if (!this.errors?.length && this.autosave) this.doSubmit();
    },

    doAction(item, $event) {
      if (this.meta.isProcessing) {
        $event.preventDefault();
        return;
      }

      if (!includes(["submit", "reset"], item?.type)) {
        // dont propagate the form if we are have an action that is not submit or reset
        $event.preventDefault();
      }

      if (isFunction(item.action)) {
        item.action({ model: this.model.value, meta: this.meta.value });
        return;
      }

      if (item.action) {
        this.$emit(item.action, {
          model: this.model.value,
          meta: this.meta.value,
        });
        return;
      }

      // fallback for submit/reset
      if (item.type === "submit") {
        this.doSubmit();
        return;
      } else if (item.type === "reset") {
        this.doReject();
        return;
      }

      this.$emit("click", { model: this.model.value, meta: this.meta.value });
    },

    doSubmit() {
      if (!this.meta.isDirty || !this.meta.isValid || this.meta.isProcessing)
        return; // safety check

      this.$emit("resolve", this.model);
      this.isDirty = false;
    },

    doReject() {
      this.model = {};
      this.isDirty = false;
      this.$emit("update:modelValue", this.model);
      this.$emit("reject");
    },

    updateUischema() {
      iterateSchema(this.uischema, (child: UISchemaElement) => {
        child.options ??= {}; //safety check
        child.options.size ??= this.size; // only set if not already set

        // map additional i18n, json forms just does title & description
        if (child.i18n) {
          const values = this?.$tm(child.i18n);
          forEach(values, (value, key) => {
            set(child.options, key, value);
          });
        }
      });
    },
  },
});
</script>
