<template>
  <div class="m-2" v-if="loading || processing">
    <progress class="progress progress-primary w-full"></progress>
  </div>

  <form-generator
    v-else-if="!loading"
    class="card-body"
    :schema="schema"
    :uischema="uischema"
    @resolve="$emit('resolve', $event)"
    @reject="$emit('reject')"
    :processing="processing"
    mode="ValidateAndHide"
  >
    <template #actions="{ isValid, doReject }">
      <button
        class="btn btn-primary"
        type="submit"
        :disabled="!isValid || processing"
      >
        Register
      </button>
      <button class="btn btn-ghost" type="reset" @click.prevent="doReject">
        Cancel
      </button>
    </template>
  </form-generator>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import FormGenerator from "../../form/components/FormGenerator.vue";
import { type JsonSchema } from "@jsonforms/core";
import { mapValues, values, isEmpty } from "lodash-es";

export default defineComponent({
  name: "RegisterForm",
  components: { FormGenerator },
  inheritAttrs: true,
  customOptions: {},
  emits: ["reject", "resolve"],
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
    },
    additionalFields: {
      type: Object as PropType<JsonSchema>,
      default: () => {}
    }
  },
  computed: {
    schema() {
      const schema = {
        type: "object",
        required: ["firstname", "password"],
        properties: {
          firstname: {
            type: "string",
            title: "Your first name"
          },
          lastname: {
            type: "string",
            title: "Your last name"
          },
          email: {
            type: "string",
            title: "Your email address",
            format: "email"
          },
          password: {
            type: "string",
            title: "Your password",
            minLength: 8
          }
        }
      };

      if (!isEmpty(this.additionalFields?.properties)) {
        schema.properties.custom_fields = this.additionalFields;
      }
      return schema;
    },

    uischema() {
      const schema = {
        type: "VerticalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/firstname",
            options: {
              focus: true,
              autocomplete: "given-name",
              placeholder: "Jay,Jane,John,... "
            }
          },
          {
            type: "Control",
            scope: "#/properties/lastname",
            options: {
              focus: true,
              autocomplete: "family-name",
              placeholder: "Doe, Smith, ..."
            }
          },
          {
            type: "Control",
            scope: "#/properties/email",
            options: {
              focus: true,
              autocomplete: "email",
              placeholder: "name@email.com"
            }
          },
          {
            type: "Control",
            scope: "#/properties/password",
            options: {
              type: "password",
              autocomplete: "current-password",
              placeholder: "Use a strong password or passphrase"
            }
          }
        ]
      };

      if (this.parsedAdditionalFields.length) {
        const additionalFields = {
          type: "Group",
          label: "Additional Fields",
          elements: this.parsedAdditionalFields
        };

        schema.elements.push(additionalFields);
      }
      return schema;
    },

    parsedAdditionalFields() {
      return values(
        mapValues(this.additionalFields?.properties, (value, key) => ({
          type: "Control",
          scope: `#/properties/custom_fields/properties/${key}`
        }))
      );
    }
  }
});
</script>
