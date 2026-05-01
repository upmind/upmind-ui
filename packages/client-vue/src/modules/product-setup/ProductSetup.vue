<template>
  <Suspense>
    <Setup
      v-if="currentBpid"
      :key="currentBpid"
      v-bind="props"
      :bpid="currentBpid"
      @resolve="onResolve"
      @reject="onReject"
    />
    <template #fallback>
      <!-- Loading state while new product configures -->
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
/**
 * Orchestrator component for product setup flow.
 *
 * This is a thin wrapper that manages which product to configure next.
 * Setup.vue emits resolve with the model, this component calls apply()
 * then advances to the next product or navigates to checkout.
 *
 * All UI rendering is delegated to Setup.
 */

// --- external
import { onUnmounted, ref } from "vue";

// --- internal
import {
  useRoutingEngine,
  useProductSetup,
  useBasket,
  type ProductModel
} from "@upmind-automation/headless";

// --- components
import Setup from "./components/Setup.vue";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";

// --- types
import type { ProductSetupProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductSetupProps>(), {
  hideSlots: () => []
});

const { navigateBack, navigateNext } = useRoutingEngine();

const { isReady: isBasketReady } = useBasket();

const {
  apply,
  getNextRequiringSetup,
  isReady: isSetupReady
} = useProductSetup();

await isBasketReady();
await isSetupReady();

/** Current basket product ID - changes trigger view remount via :key binding. */
const currentBpid = ref<string | undefined>(getNextRequiringSetup()?.id);

/** Called when Setup emits resolve - applies config then advances to next product or checkout. */
async function onResolve(model: Partial<ProductModel>) {
  return apply(model)
    .then(() => {
      const next = getNextRequiringSetup();
      if (next) {
        currentBpid.value = next.id;
      } else {
        navigateNext();
      }
    })
    .catch(() => {
      // Error is captured in useProductSetup error state
    });
}

/** Navigates back to basket. */
function onReject() {
  navigateBack();
}

// --- side Effects
onUnmounted(() => {
  useHeader({});
  useLayout({});
  useFooter({});
});
</script>
