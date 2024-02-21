<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? 'border-error' : '',
      meta.isComplete || meta.isValid ? 'border-primary' : '',
      !meta.isComplete && !meta.isValid ? 'border-warning' : ''
    ]"
  >
    <div class="card-body grid grid-cols-3">
      <h3
        class="text-inherit uppercase text-xl mt-2 mb-0 opacity-50 col-span-full"
      >
        Payment Details
      </h3>

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
        class="mt-2 gap-4 col-span-1"
        no-actions
      >
        <template #actions="{ meta }">
          <button
            type="submit"
            class="btn btn-outline btn-sm btn-primary border-none"
            :disabled="!meta.isDirty || !meta.isValid || meta.isProcessing"
            v-show="meta.isDirty"
          >
            Update payment details
          </button>
        </template>
      </upm-form-generator>

      <!-- Gateway Content -->
      <div v-show="mount" class="card card-compact bg-base-200 col-span-2">
        <div class="card-body">
          <div ref="mountedElement" class="p-4"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { UpmFormGenerator } from "@upmind/ui";
import { useBasketPaymentDetails } from "@upmind/vue";

export default defineComponent({
  name: "UpmBasketPaymentDetails",
  components: { UpmFormGenerator },
  inheritAttrs: true,
  customOptions: {},
  props: {
    actor: {
      type: Object, // xstate actor
      required: true
    }
  },
  watch: {
    mount(element) {
      if (element) {
        element?.mount(this.mountedElement as HTMLElement);
      } else {
        this.mountedElement.innerHTML = "";
      }
    }
  },

  setup(props) {
    return useBasketPaymentDetails(props.actor);
  }
});
</script>
