<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-compact"
    :class="[
      meta.hasErrors ? ' border-error' : '',
      !meta.isRenderless ? 'bg-base-200 card-bordered' : '',
    ]"
  >
    <div class="card-body">
      <!-- gateway Render Content (* IF Provided) -->
      <div ref="container"></div>

      <!-- gateway Form (* IF Provided) -->
      <upm-form-generator
        v-if="schema && uischema"
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch, ref } from "vue";
import UpmFormGenerator from "@/components/FormGenerator.vue";
import { useBasketPaymentDetailsGateway } from "@upmind/vue";

export default defineComponent({
  name: "UpmBasketPaymentDetailsGateway",
  components: { UpmFormGenerator },
  inheritAttrs: true,
  customOptions: {},
  props: {
    actor: {
      type: Object, // xstate actor
      required: true,
    },
  },

  setup(props) {
    const gateway = useBasketPaymentDetailsGateway(props.actor);
    const container = ref();
    // wait till we mount then try to render the gateway if it's provided
    // otherwise watch in case it's provided later
    onMounted(() => {
      gateway.render(container.value);
      watch(gateway.renderer, () => gateway.render(container.value));
    });

    return {
      container,
      ...gateway,
    };
  },
});
</script>
