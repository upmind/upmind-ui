<template>
  <section>
    <header class="navbar">
      <v-progress-circular v-if="loading" indeterminate :width="2" :size="40" />

      <span
        v-else-if="errors?.length"
        class="badge badge-error elevation-2"
        @click="showErrors = !showErrors"
      >
        {{ errors.length }}
      </span>
    </header>

    <v-expand-transition>
      <v-alert
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
            <!-- <code>
                <pre>{{ error }}</pre>
              </code> -->
          </li>
        </ul>
      </v-alert>
    </v-expand-transition>

    <v-card
      class="align-center pa-4 mb-4"
      :disabled="loading"
      variant="flat"
      max-width="1024"
    >
      <v-form v-if="model">
        <json-forms
          :key="timestamp"
          :ajv="ajv"
          :data="model"
          :schema="schema"
          :uischema="uischema"
          :renderers="renderers"
          @change="onChange"
        />
      </v-form>
    </v-card>

    <!-- actions -->
    <footer>
      <v-toolbar-items>
        <v-btn
          type="submit"
          variant="flat"
          append-icon="mdi-check"
          :disabled="!isValid || loading"
          :loading="loading"
          :color="$attrs.color"
          @click="doSubmit"
        >
          Save
        </v-btn>

        <v-btn :disabled="loading" variant="plain" @click="doReject">
          Cancel
        </v-btn>
      </v-toolbar-items>

      <Debug></Debug>
    </footer>

    <!-- debug -->
  </section>
</template>

<script>
import Debug from "@/components/Debug.vue";
import { JsonForms } from "@jsonforms/vue";
import { createAjv } from "@jsonforms/core";
import { extendedVuetifyRenderers } from "@jsonforms/vue-vuetify";
import {
  get,
  trim,
  isNil,
  isEmpty,
  isEqual,
  upperCase,
  defaultsDeep
} from "lodash-es";

export default defineComponent({
  name: "JsonForm",
  components: {
    JsonForms
  },
  inheritAttrs: false,
  props: {
    title: {
      type: String
    },
    singular: {
      type: String,
      required: true
    },
    plural: {
      type: String,
      default: () => `${singular}s`,
      required: true
    },
    icon: {
      type: [String, Boolean],
      default: "mdi-database"
    },
    collection: {
      type: String,
      required: true
    },
    collectionKey: {
      type: String,
      required: true
    },
    schema: {
      type: Object,
      required: true
    },
    showBack: {
      type: Boolean,
      default: true
    },
    uischema: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Object,
      default: () => ({})
    },
    transaction: {
      type: String
    },
    // ---
    isNew: {
      type: Boolean,
      default: null
    },
    debug: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ["reject", "resolve", "update:modelValue"],
  customOptions: {},
  setup() {
    // -------
    // permissions
    const ajv = createAjv({ useDefaults: true });

    // -------
    return {
      trim,
      ajv,
      // -------
      renderers: Object.freeze([...extendedVuetifyRenderers])
    };
  },
  data() {
    return {
      model: this.initModel(),
      errors: null,
      showErrors: false,
      timestamp: Date.now()
    };
  },
  computed: {
    isValid() {
      return !this.errors?.length;
    },
    safeIsNew() {
      return isNil(this.isNew)
        ? !get(this.modelValue, this.collectionKey)
        : this.isNew;
    }
  },
  watch: {
    modelValue: {
      handler(value) {
        this.model = useModelParser(toRaw(value), this.schema) || {};
      },
      deep: true
    }
  },

  methods: {
    initModel() {
      // This will take the modelValue and enure it matches the schema
      // this will set the internal model, used  by the form component
      let model = toRaw(unref(this.modelValue));
      if (isNil(this.isNew) ? !get(model, this.collectionKey) : this.isNew) {
        // build the model to ensure we have all the fields based on the schema
        const baseModel = useModelBuilder(this.schema.properties);
        model = defaultsDeep(model, baseModel);
      }

      // always parse the model to ensure it matches the schema and does not have any extra fields
      model = useModelParser(model, this.schema);
      return model;
    },

    onChange({ data, errors }) {
      this.errors = errors;
      const rawData = JSON.parse(JSON.stringify(data));
      const rawModel = JSON.parse(JSON.stringify(this.model));
      if (!isEmpty(rawData) && !isEqual(rawData, rawModel)) {
        this.model = rawData;
        this.$emit("update:modelValue", this.model);
      }
    },

    doSubmit() {
      this.$emit("resolve", {
        collection: this.collection,
        collectionKey: this.collectionKey,
        value: this.model,
        transaction: this.transaction || "save",
        options: {
          success: upperCase(this.transaction || "saved")
        },
        window: `${this.collection}-listings`
      });
    },

    doReject() {
      this.$emit("reject", {
        collection: this.collection,
        collectionKey: this.collectionKey,
        refresh: true,
        window: `${this.collection}-listings`
      });
      this.model = {};
      this.timestamp = Date.now(); // forces re-render
    }
  }
});
</script>
