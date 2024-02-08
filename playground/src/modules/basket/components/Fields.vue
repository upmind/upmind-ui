<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? '  border-error' : '',
      meta.isComplete ? ' card-bordered border-primary' : ''
    ]"
  >
    <div class="card-body">
      <upm-form-generator
        tabindex="1"
        :additional-errors="errors?.data"
        :loading="meta.isLoading"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="update"
        @update:modelValue="input"
        class="mt-2 gap-4"
      >
        <template #actions="{ meta }">
          <button
            type="submit"
            class="btn btn-outline btn-sm btn-primary border-none"
            :disabled="!meta.isDirty || !meta.isValid || meta.isProcessing"
          >
            Update fields
          </button>
        </template>
      </upm-form-generator>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { UpmFormGenerator } from "@upmind/ui";
import { useBasketFields } from "@upmind/vue";

export default defineComponent({
  name: "UpmBasketFields",
  components: { UpmFormGenerator },
  inheritAttrs: true,
  customOptions: {},
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },

    item: {
      type: Object, // xstate actor
      required: true
    }
  },

  setup(props) {
    return useBasketFields(props.item);
  }
});
</script>
