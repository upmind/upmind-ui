<template>
  <UpmCard
    class="relative flex flex-col gap-y-4 !p-8 !py-7"
    :class="[
      !meta.isProcessing && (meta.hasErrors || props.error)
        ? 'ring-error !ring-error-1 ring-1'
        : 'ring-offset-background focus-within:ring-ring focus-within:outline-none focus-within:ring-1 focus-within:ring-offset-1 group-focus-within:ring-0 group-focus-within:ring-offset-0',
    ]"
  >
    <UpmBasketItemSummary
      v-for="(pricing, index) in summary.pricing"
      :key="`${props.id}-${index}`"
      :id="props.id"
      :product="props.product"
      :pricing="pricing"
      :quantity="props.quantity"
      :is-first="index === 0"
      :is-last="index === summary.pricing.length - 1"
    />

    <UpmRequiredAlert v-if="meta.hasErrors" :id="props.id" />

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
  </UpmCard>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- components
import { UpmCard } from "@upmind-automation/client-vue";
import UpmBasketConfigurationDetails from "./BasketItemConfigurationDetails.vue";
import UpmBasketItemSummary from "./BasketItemSummary.vue";
import UpmBasketItemActions from "./BasketItemActions.vue";
import UpmRequiredAlert from "./components/RequiredAlert.vue";

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
