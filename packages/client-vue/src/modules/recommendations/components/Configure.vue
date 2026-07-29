<template>
  <Drawer
    v-if="pendingProduct"
    fit="cover"
    open
    :title="t('action.configure_your_product')"
    :description="t('text.product_info_needed_msg')"
    :dismissible="false"
  >
    <ProductConfig
      v-if="pendingProduct && productMeta?.isAvailable"
      as="fieldset"
      :item="pendingProduct"
      :model-value="pendingProduct?.id"
      :meta="configMeta"
      :touched="productMeta?.showErrors"
      no-footer
      @resolve="doResolve"
      @reject="doReject"
    />

    <template #close>
      <Link @click="doReject" :label="t('action.cancel')" size="lg" />
    </template>

    <template #actions>
      <Button
        :loading="productMeta.isProcessing"
        :disabled="productMeta.isProcessing"
        @click="doResolve"
        :label="t('action.add_to_basket')"
        prependIcon="plus-circle"
        color="primary"
        size="lg"
      />
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
// --- external
import { provide } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRecommendations,
  useBasketProductsPending,
  useConfig,
  useProductConfig,
  UIContext,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";

// --- components
import ProductConfig from "../../product/components/Config.vue";
import { Button, Drawer } from "@upmind-automation/upmind-ui";

// --- types
import type { RecommendationConfigurationProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<RecommendationConfigurationProps>();

const emit = defineEmits<{
  (e: "resolve"): void;
  (e: "reject"): void;
}>();
// ---

const { t } = useI18n();

// --- basket setup

const { cancel } = useRecommendations();
const { resolve, add } = useBasketProductsPending();

const {
  update,
  service: pendingProduct,
  onDone,
  isReady
} = await add(props.modelValue.productId, props.modelValue);

const productConfig = useProductConfig(pendingProduct);
if (!productConfig)
  throw new DetailedError(
    t("error.product_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );
provide("useProductConfig", productConfig);

const { meta: productMeta, product } = productConfig;

const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

await isReady();

// ---

async function doResolve() {
  update()
    .then(() => {
      resolve(pendingProduct);
      emit("resolve");
    })
    .catch(error => {
      console.warn("Product Configuration Error", error);
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      onDone().then(() => {
        resolve(pendingProduct);
        emit("resolve");
      });
    });
}

function doReject() {
  cancel();
  stop();
  emit("reject");
}
</script>
