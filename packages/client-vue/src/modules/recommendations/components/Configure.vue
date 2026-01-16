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
      v-if="!configMeta?.isLoading"
      :meta="meta"
      :item="pendingProduct"
      :model-value="pendingProduct?.id"
      :no-footer="true"
      as="div"
      @resolve="doResolve"
      @reject="doReject"
    />

    <template #close>
      <Link @click="doReject" :label="t('action.cancel')" size="lg" />
    </template>

    <template #actions>
      <Button
        :loading="configMeta.isProcessing"
        :disabled="configMeta.isProcessing"
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
import { watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRecommendations,
  useBasketProductsPending,
  useConfig,
  UIContext
} from "@upmind-automation/headless";
import { useStyles, Link } from "@upmind-automation/upmind-ui";
import config from "../recommendations.config";

// --- components
import ProductConfig from "../../product/components/config/Config.vue";
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
const { configure, resolve } = useBasketProductsPending();
const {
  meta: configMeta,
  product,
  stop,
  update,
  isReady,
  service: pendingProduct
} = await configure(props.modelValue);
await isReady();

const meta = useConfig({
  product: () => product.value
});

// ---
const styles = useStyles(["recommendation.configuration"], {}, config);
// ---

async function doResolve() {
  update()
    .then(() => {
      resolve(pendingProduct);
      emit("resolve");
    })
    .catch(() => {
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      watch(
        configMeta,
        ({ isDone }) => {
          if (isDone) {
            resolve(pendingProduct);
            emit("resolve");
          }
        },
        {
          immediate: true
        }
      );
    });
}

function doReject() {
  cancel();
  stop();
  emit("reject");
}
</script>
