<template>
  <section class="provisioning" v-if="hasFields">
    <h4 class="">Additional Information</h4>

    <upm-form-generator
      class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-box"
      :schema="fields"
      :model-value="modelValue"
      :additional-errors="additionalErrors"
      @update:modelValue="doUpdate"
      no-actions
    />
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { UpmFormGenerator } from "@upmind/ui";
import { type JsonSchema } from "@jsonforms/core";
import { get, isEmpty } from "lodash-es";
import type { ErrorObject } from "ajv";

export default defineComponent({
  name: "ProductConfigProvisioning",
  components: { UpmFormGenerator },
  inheritAttrs: true,
  customOptions: {},
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    fields: {
      type: Object as PropType<JsonSchema>,
      required: true
    },
    modelValue: {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    function getValue(field) {
      const value = get(props.modelValue, field, null);
      return value;
    }

    const doUpdate = value => emit("update:modelValue", value);

    return {
      getValue,
      doUpdate
    };
  },
  computed: {
    hasFields() {
      return !isEmpty(this.fields?.properties);
    }
  }
});
</script>
