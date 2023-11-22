<template>
  <form-generator
    class="card-body"
    :schema="schema"
    :uischema="uischema"
    :additional-errors="additionalErrors"
    @resolve="$emit('resolve', $event)"
    @reject="$emit('reject')"
    :processing="processing"
  >
    <template #actions="{ isValid, doReject }">
      <button
        class="btn btn-primary"
        type="submit"
        :disabled="!isValid || processing"
      >
        login
      </button>
      <button class="btn btn-ghost" type="reset" @click.prevent="doReject">
        cancel
      </button>
    </template>
  </form-generator>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import FormGenerator from "../../form/components/FormGenerator.vue";
import type { ErrorObject } from "ajv";

export default defineComponent({
  name: "AuthForm",
  components: { FormGenerator },
  inheritAttrs: true,
  customOptions: {},
  emits: ["reject", "resolve"],
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    additionalErrors: {
      type: Array as PropType<
        ErrorObject<string, Record<string, any>, unknown>[]
      >,
      default: () => []
    }
  },
  computed: {
    schema() {
      return {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            title: "Your email"
          },
          password: {
            type: "string",
            format: "password",
            title: "Your password"
          }
        }
      };
    },
    uischema() {
      return {
        type: "VerticalLayout",
        elements: [
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
    }
  }
});
</script>
