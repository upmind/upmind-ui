<template>
  <section class="provisioning" v-if="hasFields">
    <h4 class="">Additional Information</h4>

    <div
      class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-xl"
    >
      <form-generator
        :schema="fields"
        :model-value="modelValue"
        @update:modelValue="doUpdate"
        debug
        no-actions
      />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FormGenerator from "../../form/components/FormGenerator.vue";
import { type JsonSchema } from "@jsonforms/core";
import { get, isEmpty } from "lodash-es";

export default defineComponent({
  name: "ProductConfigProvisioning",
  components: { FormGenerator },
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
