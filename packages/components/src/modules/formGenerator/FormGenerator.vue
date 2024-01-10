<template>
  <form
    class="card align-center w-full max-w-screen-lg"
    v-bind="$attrs"
    :disabled="meta.isProcessing"
    @submit.prevent="doSubmit"
  >
    <div class="m-2" v-if="meta.isLoading">
      <progress class="progress progress-primary w-full"></progress>
    </div>

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
      class="card-content"
    />

    <!-- actions -->
    <footer v-if="!noActions || meta.isLoading">
      <div class="card-actions mt-4">
        <slot name="actions" v-bind="{ meta, doReject, doResolve: doSubmit }">
          <button
            type="submit"
            class="btn btn-accent"
            :disabled="!meta.isValid || meta.isProcessing"
          >
            Save
          </button>

          <button
            :disabled="meta.isProcessing"
            class="btn btn-ghost"
            @click="doReject"
          >
            Cancel
          </button>
        </slot>
      </div>
    </footer>
  </form>

  <!-- debug -->
  <upm-debug
    v-if="debugging"
    title="Form"
    :open="{ state: true }"
    :state="model"
    :errors="errors"
    :context="{ schema, uischema }"
  ></upm-debug>
</template>

<script lang="ts">
import { defineComponent, toRaw, unref, type PropType } from "vue";

import { useValidation } from "./utils";

import UpmDebug from "../debug/Debug.vue";

import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { JsonForms } from "@jsonforms/vue";
import {
  type ValidationMode,
  type JsonSchema,
  type UISchemaElement
} from "@jsonforms/core";

import type { ErrorObject } from "ajv";

import { defaultStyles, mergeStyles, daisyRenderers } from "./renderers/daisy";

import { trim, isEmpty, isEqual, isObject, isArray } from "lodash-es";

// a custom isEmpty that can handle deeply nested objects
function isDeepEmpty(value: any): boolean {
  if (isEmpty(value)) {
    return true;
  }
  if (isObject(value)) {
    for (const item of Object.values(value)) {
      // if item is not undefined and is a primitive, return false
      // otherwise dig deeper
      if (
        (item !== undefined && typeof item !== "object") ||
        !isDeepEmpty(item)
      ) {
        return false;
      }
    }
    return true;
  }
  if (isArray(value)) {
    return value.every(item => isDeepEmpty(item));
  }
  return isEmpty(value);
}

export default defineComponent({
  name: "FormGenerator",
  components: {
    JsonForms,
    UpmDebug
  },
  inheritAttrs: true,
  props: {
    schema: {
      type: Object as PropType<JsonSchema>,
      required: true
    },
    uischema: {
      type: Object as PropType<UISchemaElement>
    },
    modelValue: {
      type: Object
    },
    // ---
    noActions: {
      type: Boolean,
      default: false
    },
    debugging: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
    },
    mode: {
      required: false,
      type: String as PropType<ValidationMode>,
      default: "ValidateAndShow" // ||  "ValidateAndHide" || "NoValidation"
    },
    styles: {
      type: Object,
      default: () => ({})
    },
    additionalErrors: {
      type: Array as PropType<
        ErrorObject<string, Record<string, any>, unknown>[]
      >,
      default: () => []
    }
  },
  watch: {
    modelValue: {
      handler(value) {
        this.model = toRaw(unref(value)) || {};
      },
      immediate: true,
      deep: true
    }
  },
  emits: ["reject", "resolve", "update:modelValue", "valid"],
  customOptions: {},
  setup(props) {
    // -------

    const { ajv } = useValidation();

    // mergeStyles combines all classes from both styles definitions into one
    const formStyles = mergeStyles(defaultStyles, props.styles);

    // -------
    return {
      trim,
      // -------
      ajv,
      renderers: Object.freeze([...daisyRenderers]),
      formStyles
    };
  },
  data: () => ({
    model: {},
    errors: [],
    isDirty: false
  }),
  computed: {
    meta() {
      return {
        isLoading: this.loading,
        isProcessing: this.processing,
        isDirty: this.isDirty,
        isValid: !this.errors?.length
      };
    },

    safeMode() {
      // only show errors if we have some data,, prevents ugly errors on first load
      return isDeepEmpty(this.model) || !this.isDirty
        ? "ValidateAndHide"
        : this.mode || "ValidateAndShow";
    }
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

      if (!isEmpty(rawData) && !isEqual(rawData, rawModel)) {
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
    }
  },
  provide() {
    return {
      styles: this.formStyles
    };
  }
});
</script>
