<template>
  <Card :class="styles.summary.card" as="aside" class="">
    <header :class="styles.summary.header">
      <SummaryPricing
        :pricing="product.pricing"
        :meta="product.meta"
        :loading="meta.isLoading"
        :processing="meta.isCalculating"
      />
    </header>

    <footer :class="styles.summary.footer">
      <NumberField
        v-if="product.productDetails.quantifiable"
        :min="product.productDetails.min"
        :max="product.productDetails.max"
        :step="product.productDetails.step"
        :model-value="product.configuration.quantity"
        :default-value="
          product.configuration.quantity || product.productDetails.step
        "
        @update:modelValue="updateQuantity"
      />

      <Button
        block
        type="submit"
        color="secondary"
        :loading="meta.isProcessing"
        :disabled="meta.isLoading || meta.isCalculating || meta.isInvalid"
        :label="t('product.actions.resolve')"
        @click="doResolve"
      >
        <template #prepend>
          <Icon icon="cart" size="2xs" />
        </template>
      </Button>
    </footer>
  </Card>

  <Alert
    v-if="hasErrors"
    :title="t('product.incomplete.title')"
    :description="t('product.incomplete.description')"
    icon="alert"
    color="error"
    class="mt-4"
  />

  <SummaryList v-bind="product" />
</template>

<script setup lang="ts">
// --- external
import { computed, ref, watch } from "vue";
import { useProductConfig } from "@upmind-automation/headless-vue";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./summary.config";

// --- components
import Card from "../../../../components/content/Card.vue";
import SummaryPricing from "./SummaryPricing.vue";
import SummaryList from "./SummaryList.vue";
import { NumberField, Icon, Button, Alert } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------

const props = defineProps<{
  item: ActorRef<any>;
}>();

const emits = defineEmits(["resolve"]);

const { t, te } = useI18n();

const showErrors = ref(false);

const { product, meta, model, updateQuantity } = useProductConfig(props.item);

const styles = useStyles(["summary"], {}, config) as ComputedRef<{
  summary: {
    card: string;
    footer: string;
    header?: string;
  };
}>;

const hasErrors = computed(() => {
  return meta.value.hasErrors && showErrors.value;
});

watch(hasErrors, () => {
  if (hasErrors.value) {
    // Auto-scroll to the first error
  } else {
    showErrors.value = false;
  }
});

// ---
const doResolve = async () => {
  emits("resolve", model.value);
  showErrors.value = true;
};
</script>
