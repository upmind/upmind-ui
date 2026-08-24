<template>
  <!-- Product Setup — the inline setup section. The provisioning still
       outstanding after add, one product per stage (mirroring the standalone
       product-setup flow); Continue applies and advances, and the card
       disappears once nothing is staged. NB the PARENT owns v-show
       visibility, so the Section root must not carry its own v-show. -->
  <Section
    v-if="currentBpid"
    id="basket-products-setup"
    :label="label"
    icon="asterisk-02"
    :card="true"
    :disabled="props.disabled"
  >
    <!-- Desktop shows the product name in the header beside the fixed title.
         Mobile's narrow header can't fit both, so the name becomes the section
         title itself (as the standalone product-setup does) and the slot drops. -->
    <template v-if="productName && !isMobile" #actions>
      <span :class="setupProductNameVariants()">{{ productName }}</span>
    </template>

    <div v-auto-animate>
      <!-- Configure only once enabled (billing captured): the form then seeds
           from the provision fields billing prefilled, so a field billing fills
           is already complete and never renders. The disabled section hides its
           body regardless; deferring the mount also skips the premature
           configure. -->
      <Suspense v-if="!props.disabled">
        <ProductSetupForm
          :key="currentBpid"
          :bpid="currentBpid"
          @resolve="onResolve"
        />
        <template #fallback>
          <CheckoutSetupSkeleton />
        </template>
      </Suspense>
      <Button
        v-if="!props.disabled && !setupMeta.isLoading"
        type="submit"
        form="setup-form"
        :loading="setupMeta.isProcessing"
        variant="primary"
        size="lg"
        :class="setupContinueVariants()"
      >
        {{ t("action.continue_label") }}
      </Button>
    </div>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
// --- internal
import { useProductSetup } from "@upmind-automation/headless";
// --- components
import { Button } from "@upmind/ui";
import Section from "../../../components/section/Section.vue";
import { isMobile } from "../../../composables/isMobile";
import ProductSetupForm from "../../product-setup/components/ProductSetupForm.vue";
import { setupContinueVariants, setupProductNameVariants } from "../variants";
import CheckoutSetupSkeleton from "./CheckoutSetupSkeleton.vue";
// --- utils
import { isNil, some } from "lodash-es";
import type { CheckoutProductSetupProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<CheckoutProductSetupProps>();

const { t } = useI18n();

const {
  getNextRequiringSetup,
  isReady,
  meta: setupMeta,
  products,
  reset
} = useProductSetup();

await isReady();

const current = ref(getNextRequiringSetup());
const currentBpid = computed(() => current.value?.id);

// A basket refresh can flag a product after mount (auth token swap, billing
// commit re-runs the provision check). Stage it only when nothing is in
// progress, so an active form is never remounted mid-edit.
watch([products, () => setupMeta.value.isLoading], () => {
  // An in-flight basket reports nothing requiring setup, which reads as "the
  // staged product was removed" — re-staging on that unmounts the section and
  // takes any open drawer with it. Re-run once the basket settles instead.
  if (setupMeta.value.isLoading) return;

  // Re-stage when nothing is staged, OR when the staged product has left the
  // basket (removed mid-setup) — otherwise never remount an in-progress form.
  const staged = current.value;
  if (isNil(staged) || !some(products.value, { id: staged.id })) {
    current.value = getNextRequiringSetup();
  }
});

// The product currently being configured (service identifier, else its name).
const productName = computed(() => {
  if (!currentBpid.value) return undefined;
  return current.value?.serviceIdentifier ?? current.value?.product?.name;
});

// Mobile promotes the product name to the section title (product-setup style);
// desktop keeps the fixed title and shows the name in the header alongside it.
const label = computed(() => {
  if (isMobile.value && productName.value) return productName.value;
  return t("cart.product_setup_details");
});

// Config is applied by the form; on the resolve signal, advance to the next
// product needing setup (the section hides when none remain).
function onResolve() {
  current.value = getNextRequiringSetup();
}

onUnmounted(() => reset());
</script>
