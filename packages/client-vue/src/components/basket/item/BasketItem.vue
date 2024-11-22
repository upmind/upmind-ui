<template>
  <div class="bg-base flex flex-col gap-y-4 p-8 pb-7">
    <UpmBasketItemSummary
      v-for="pricing in summary.pricing"
      :key="pricing.key"
      :id="props.id"
      :product="props.product"
      :pricing="pricing"
      :quantity="props.quantity"
    />

    <!-- These margins help us position correctly (there is additional space when the details are closed) -->
    <div v-auto-animate class="-my-2">
      <UpmBasketConfigurationDetails
        v-if="open"
        :details="filteredDetails"
        class="-mb-2 mt-2"
      />
    </div>

    <UpmBasketItemActions
      v-model:isOpen="open"
      :id="props.id"
      :details="filteredDetails"
      :is-disabled="meta.isProcessing || meta.isLoading"
      :remove="remove"
      details-button-label="Show details"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";
// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- components
import UpmBasketConfigurationDetails from "./BasketItemConfigurationDetails.vue";
import UpmBasketItemSummary from "./BasketItemSummary.vue";
import UpmBasketItemActions from "./BasketItemActions.vue";

// --- types
import { type BasketProduct } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    BasketProduct & {
      open?: boolean;
      error: boolean;
    }
  >(),
  {
    open: false,
  }
);

const emits = defineEmits(["update:open"]);

const open = useVModel(props, "open", emits);

const { remove, meta } = useBasketProduct(props.id);

const filteredDetails = computed(() => {
  return props.summary.details.filter(item => item.key !== "term");
});
</script>
