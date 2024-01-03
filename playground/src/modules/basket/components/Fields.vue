<template>
  <div class="fields px-4" v-if="hasFields">
    <upm-form-generator
      class="mt-2"
      :schema="schema"
      :uischema="uischema"
      :model-value="modelValue"
      :additional-errors="additionalErrors"
      :processing="processing"
      no-actions
      @update:modelValue="doResolve"
    >
    </upm-form-generator>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import { UpmFormGenerator } from "@upmind/components";
import { isEmpty } from "lodash-es";
import type { ErrorObject } from "ajv";

export default defineComponent({
  name: "ConfigPromotions",
  components: { UpmFormGenerator },
  inheritAttrs: true,
  customOptions: {},
  emits: ["reject", "resolve"],
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Object,
      required: true
    },
    schema: {
      type: Object,
      required: true
    },
    uischema: {
      type: Object,
      required: true
    },
    additionalErrors: {
      type: Array as PropType<
        ErrorObject<string, Record<string, any>, unknown>[]
      >,
      default: () => []
    }
  },
  computed: {
    hasFields() {
      return !isEmpty(this.schema.properties);
    }
  },
  methods: {
    doReject(value) {
      this.$emit("reject", value);
    },
    doResolve(value) {
      this.$emit("resolve", value);
    }
  }
});
</script>
