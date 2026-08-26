<template>
  <!-- The one product-setup form, shared by the standalone setup page and the
       checkout's inline setup section. Rendered as the <form> itself (id
       "setup-form"); each host places its own Continue button in its layout and
       submits natively via form="setup-form". No loading overlay — hosts own that. -->
  <div :class="formRootVariants()">
    <slot name="errors">
      <Alert
        v-if="externalErrors?.message || setupMeta?.hasError"
        :class="formFullVariants()"
        variant="danger"
        appearance="outline"
        :title="t('error.product_setup', total)"
        :description="externalErrors?.message || setupError?.message"
      >
        <template #icon><Icon icon="alert-triangle" /></template>
      </Alert>
    </slot>

    <!-- Gate on hasSchema, not isLoading: a basket-processing tick (e.g.
         registering a domain in the SmartDomainField drawer) must not unmount
         the form mid-flow. -->
    <Form
      v-if="setupMeta.hasSchema && productMeta?.isAvailable"
      :loading="productMeta.isLoading"
      :processing="setupMeta.isProcessing"
      :disabled="setupMeta.isProcessing || productMeta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      :model-value="model"
      :additional-errors="additionalErrors"
      :touched="meta.showErrors"
      @update:modelValue="setConfig"
      @resolve="doResolve"
      id="setup-form"
      autocomplete="on"
      no-actions
    >
      <template #additional>
        <ApplyToOthers
          v-if="setupMeta.hasSimilar && !setupMeta.isLoading"
          v-model="selected"
          :products="similarProducts"
          :loading="setupMeta.isLoading"
          :disabled="setupMeta.isProcessing"
        />
      </template>
    </Form>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { Alert } from "@upmind/ui";
import { computed, provide } from "vue";
import { useI18n } from "vue-i18n";
// --- internal
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  UIContext,
  useConfig,
  useProductConfig,
  useProductSetup
} from "@upmind-automation/headless";
// --- components
import Form from "../../../components/form/Form.vue";
import { Icon } from "../../../components/icon";
import { formFullVariants, formRootVariants } from "../variants";
import ApplyToOthers from "./ApplyToOthers.vue";
// --- types
import type { ProductSetupFormProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductSetupFormProps>();

const emit = defineEmits<{
  resolve: [];
  reject: [];
}>();

const { t } = useI18n();

const {
  apply,
  configure,
  error: setupError,
  meta: setupMeta,
  schema,
  uischema,
  selected,
  similarProducts,
  total
} = useProductSetup();

const { service: basketProduct } = await configure(props.bpid);

const basketProductConfig = useProductConfig(basketProduct);

if (!basketProductConfig) {
  emit("reject");
  throw new DetailedError(
    t("error.product_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );
}
provide("useProductConfig", basketProductConfig);

const {
  meta: productMeta,
  model,
  product,
  externalErrors,
  additionalErrors,
  setConfig
} = basketProductConfig;

useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

// --- meta

const meta = computed(() => {
  return {
    // the basket seeds this product's errors on load, so they describe a save
    // the shopper hasn't made yet — hold them until they edit, or an apply fails
    showErrors:
      (productMeta.value.showErrors && productMeta.value.isTouched) ||
      setupMeta.value.hasError
  };
});

// Commit this product's config (plus any apply-to-others), then signal done so
// the host advances. A failed apply throws here — surfaced via the error Alert —
// so the emit is skipped and the shopper stays on the current product.
async function doResolve() {
  if (!model.value || productMeta.value.isInvalid) return;
  await apply(model.value);
  emit("resolve");
}
</script>
