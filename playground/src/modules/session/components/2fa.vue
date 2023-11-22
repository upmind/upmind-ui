<template>
  <form-generator
    class="card-body"
    :schema="schema"
    :uischema="uischema"
    :additional-errors="additionalErrors"
    @reject="$emit('reject')"
    @resolve="$emit('resolve', $event?.token)"
    :processing="processing"
  >
    <template #actions="{ isValid, doReject }">
      <button
        class="btn btn-primary"
        type="submit"
        :disabled="!isValid || processing"
      >
        Verify
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
import type { ErrorObject } from "ajv";

export default defineComponent({
  name: "2faForm",
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
        required: ["token"],
        properties: {
          token: {
            type: "string",
            pattern: "\\d{6}",
            title: "Your 2fa code"
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
            scope: "#/properties/token",
            options: {
              autocomplete: "off",
              placeholder: "123 456"
              // mask: "### ###"
            }
          }
        ]
      };
    }
  }
});
</script>
