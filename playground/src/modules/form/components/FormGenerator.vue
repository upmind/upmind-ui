<template>
  <form
    class="card align-center w-full max-w-screen-lg"
    v-bind="$attrs"
    :disabled="processing"
    @submit.prevent="doSubmit"
  >
    <json-forms
      :ajv="ajv"
      :data="model"
      :schema="schema"
      :uischema="uischema"
      :renderers="renderers"
      :validationMode="mode"
      @change="onChange"
      class="card-content"
    />

    <!-- actions -->
    <footer v-if="!noActions">
      <div class="card-actions mt-4">
        <slot
          name="actions"
          v-bind="{ isValid, doReject, doResolve: doSubmit }"
        >
          <button
            type="submit"
            class="btn btn-accent"
            :disabled="!isValid || processing"
          >
            Save
          </button>

          <button
            :disabled="processing"
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
  <debug
    v-if="debugging"
    title="Form"
    :open="{ state: true }"
    :state="model"
    :errors="errors"
    :context="{ schema, uischema }"
  ></debug>
</template>

<script lang="ts">
import { defineComponent, toRaw, type PropType } from "vue";

import Debug from "@/components/Debug.vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { JsonForms } from "@jsonforms/vue";
import {
  createAjv,
  type ValidationMode,
  type JsonSchema,
  type UISchemaElement
} from "@jsonforms/core";

import { defaultStyles, mergeStyles, daisyRenderers } from "../renderers/daisy";

import { trim, isEmpty, isEqual } from "lodash-es";

export default defineComponent({
  name: "FormGenerator",
  components: {
    JsonForms,
    Debug
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
    processing: {
      type: Boolean,
      default: false
    },
    mode: {
      required: false,
      type: String as PropType<ValidationMode>,
      default: "ValidateAndShow" // ||  "ValidateAndHide" || "NoValidation"
    }
  },
  watch: {
    modelValue: {
      handler(value) {
        this.model = toRaw(value);
      },
      deep: true
    }
  },
  emits: ["reject", "resolve", "update:modelValue"],
  customOptions: {},
  setup(props) {
    // -------
    const ajv = createAjv({ useDefaults: true });

    // mergeStyles combines all classes from both styles definitions into one
    const tailwindStyles = mergeStyles(defaultStyles, {
      control: {},
      verticalLayout: {}
    });

    console.log("tailwindStyles", { tailwindStyles });

    // -------
    return {
      trim,
      // -------
      ajv,
      renderers: Object.freeze([...daisyRenderers]),
      tailwindStyles
    };
  },
  data: () => ({
    model: {},
    errors: [],
    showErrors: false
  }),
  computed: {
    isValid() {
      return !this.errors?.length;
    }
  },

  methods: {
    onChange({ data, errors }: JsonFormsChangeEvent) {
      this.errors = errors;

      // finally check if the data has actually changed and emit the update event
      // this json parse/stringify is a hack to do a deep compare and ignore functions/reactivity
      const rawData = JSON.parse(JSON.stringify(data));
      const rawModel = JSON.parse(JSON.stringify(this.model));
      if (!isEmpty(rawData) && !isEqual(rawData, rawModel)) {
        this.model = data;
        this.$emit("update:modelValue", this.model);
      }
    },

    doSubmit() {
      this.$emit("resolve", this.model);
    },

    doReject() {
      this.$emit("reject");
      this.model = {};
    }
  },
  provide() {
    return {
      styles: this.tailwindStyles
    };
  }
});
</script>
