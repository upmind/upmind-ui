<template>
  <Loading :active="meta.isLoading || meta.isProcessing" class="text-secondary">
    <UpmCard
      class="relative flex flex-col gap-y-4 !p-6 !py-7 md:!p-9 md:!py-10"
      :class="[
        !meta.isProcessing && (meta.hasErrors || error)
          ? 'ring-error !ring-error-1 ring-1'
          : 'ring-offset-background focus-within:ring-ring focus-within:outline-none focus-within:ring-1 focus-within:ring-offset-1 group-focus-within:ring-0 group-focus-within:ring-offset-0',
      ]"
    >
      <UpmBasketProductSummary
        v-for="(pricing, index) in summary.pricing"
        :key="`${props.id}-${index}`"
        :id="id"
        :product="product"
        :pricing="pricing"
        :quantity="quantity"
        :error="error"
        :is-first="index === 0"
        :is-last="index === summary.pricing.length - 1"
      />

      <!-- These margins help us position correctly (there is additional space when the details are closed) -->
      <div v-auto-animate class="-my-2">
        <UpmBasketConfigurationDetails
          v-if="open"
          :id="id"
          :details="summary.details"
          :product="product"
          class="-mb-2 mt-2"
        />
      </div>

      <UpmBasketProductActions
        v-model:isOpen="open"
        :id="props.id"
        :details="summary.details"
        :is-disabled="meta.isProcessing || meta.isLoading"
        :remove="remove"
        details-button-label="Show details"
      />
    </UpmCard>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";
import { some } from "lodash-es";

// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- components
import { UpmCard } from "@upmind-automation/client-vue";
import { Loading } from "@upmind-automation/upwind";
import UpmBasketConfigurationDetails from "./BasketProductConfigurationDetails.vue";
import UpmBasketProductSummary from "./BasketProductSummary.vue";
import UpmBasketProductActions from "./BasketProductActions.vue";

// --- types
import { type BasketProduct } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    BasketProduct & {
      open?: boolean;
      error: boolean;
      loading: boolean;
      processing: boolean;
    }
  >(),
  {
    open: false,
  }
);

const emits = defineEmits(["update:open"]);

const open = useVModel(props, "open", emits);

const { remove } = useBasketProduct(props.id);

const meta = computed(() => {
  return {
    isLoading: props.loading,
    isProcessing: props.processing,
    hasErrors: !!props.error || some(props.summary?.details, "invalid"),
  };
});
</script>
