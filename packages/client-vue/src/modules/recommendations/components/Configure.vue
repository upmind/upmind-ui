<template>
  <Drawer
    v-if="pendingProduct"
    :open="true"
    :dismissible="false"
    :title="t('action.configure_your_product')"
    :description="t('text.product_info_needed_msg')"
    :ui="{
      header: 'mx-auto w-full max-w-app md:px-6 lg:px-18',
      body: 'mx-auto flex w-full max-w-app flex-col md:px-6 lg:px-18',
      footer:
        'mx-auto w-full max-w-app md:px-6 lg:px-18 lg:flex-row lg:justify-between'
    }"
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

    <template #footer>
      <Link @click="doReject" size="md">{{ t("action.cancel") }}</Link>
      <Button
        :loading="productMeta.isProcessing"
        @click="doResolve"
        variant="primary"
        size="lg"
      >
        {{ t("action.add_to_basket") }}
      </Button>
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
import { Link } from "@upmind/ui";
import { Drawer } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { provide } from "vue";
import { useI18n } from "vue-i18n";
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
import ProductConfig from "../../product/components/Config.vue";
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
