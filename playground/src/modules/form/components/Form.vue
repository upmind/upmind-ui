<template>
  <section>
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Form</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions">
          <button
            v-if="errors?.length"
            class="badge badge-error elevation-2"
            @click="showErrors = !showErrors"
          >
            {{ errors.length }}
          </button>
        </slot>
      </div>
    </header>

    <!-- <v-expand-transition> -->
    <div v-if="errors?.length && showErrors" class="">
      <code>
        <pre class="bg-base-100 text-error-content border border-error m-0">{{
          errors
        }}</pre>
      </code>
    </div>
    <!-- <v-alert
      v-if="errors?.length"
      v-model="showErrors"
      density="compact"
      type="error"
      title="Issues need resolving before you can save"
      variant="tonal"
      icon="mdi-alert-circle-outline"
      closable
      :rounded="0"
    >
      <ul>
        <li v-for="(error, i) in errors" :key="i">
          {{ trim(error.instancePath, "/") }} {{ error.message }}
        </li>
      </ul>
    </v-alert> -->
    <!-- </v-expand-transition> -->

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
        <div class="card-actions">
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
  </section>
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
      type: Object,
      required: true
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
