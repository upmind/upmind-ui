<template>
  <form
    class="card align-center p-4 my-4 w-ful max-w-screen-lg"
    :disabled="processing"
    @submit.prevent="doSubmit"
  >
    <json-forms
      :ajv="ajv"
      :data="model"
      :schema="schema"
      :uischema="uischema"
      :renderers="renderers"
      @change="onChange"
      class="card-content"
    />

    <!-- actions -->
    <footer>
      <div class="card-actions mt-8">
        <button
          type="submit"
          class="btn btn-accent"
          :disabled="!isValid || processing"
        >
          Save
        </button>

        <button :disabled="processing" class="btn btn-ghost" @click="doReject">
          Cancel
        </button>
      </div>
    </footer>
  </form>

  <!-- debug -->
  <Debug
    title="Form"
    :open="{ state: true }"
    :state="model"
    :errors="errors"
    :context="{ schema, uischema }"
  ></Debug>
</template>

<script lang="ts">
import { defineComponent, toRef, ref } from "vue";

import Debug from "@/components/Debug.vue";
import { JsonForms, JsonFormsChangeEvent } from "@jsonforms/vue";
import { createAjv } from "@jsonforms/core";

import { defaultStyles, mergeStyles, daisyRenderers } from "../renderers/daisy";

import { trim, isEmpty, isEqual } from "lodash-es";

export default defineComponent({
  name: "JsonForm",
  components: {
    JsonForms,
    Debug
  },
  inheritAttrs: false,
  props: {
    schema: {
      type: Object,
      required: true
    },
    uischema: {
      type: Object
    },
    modelValue: {
      type: Object,
      default: () => ({})
    },
    // ---
    debug: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
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
      this.model = data;

      // finally check if the data has actually changed and emit the update event
      // this json parse/stringify is a hack to do a deep compare and ignore functions/reactivity
      const rawData = JSON.parse(JSON.stringify(data));
      const rawModel = JSON.parse(JSON.stringify(this.model));
      if (!isEmpty(rawData) && !isEqual(rawData, rawModel)) {
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
