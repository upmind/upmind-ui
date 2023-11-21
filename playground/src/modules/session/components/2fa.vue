<template>
  <form-generator
    class="card-body"
    :schema="schema"
    :uischema="uischema"
    @reject="$emit('reject')"
    @resolve="$emit('resolve', $event?.token)"
    :processing="processing"
    mode="ValidateAndHide"
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
import { defineComponent } from "vue";
import FormGenerator from "../../form/components/FormGenerator.vue";

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
            title: "Your 2fa code",
            minimum: 0,
            maximum: 999999
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
              placeholder: "123 456",
              mask: "### ###"
            }
          }
        ]
      };
    }
  }
});
</script>
