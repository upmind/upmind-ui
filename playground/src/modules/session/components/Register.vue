<template>
  <form-generator
    :loading="loading"
    :processing="processing"
    :schema="schema"
    :uischema="uischema"
    @reject="$emit('reject')"
    @resolve="$emit('resolve', $event)"
    class="card-body"
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
import { type JsonSchema, type UISchemaElement } from "@jsonforms/core";

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
    schema: {
      type: Object as PropType<JsonSchema>,
      required: true
    },
    uischema: {
      type: Object as PropType<UISchemaElement>
    },
    modelValue: {
      type: Object
    }
  },
  computed: {}
});
</script>
