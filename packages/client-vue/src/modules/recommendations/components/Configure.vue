<template>
  <Drawer
    v-if="pendingProduct"
    to="#vue-app"
    fit="cover"
    skrim="primary"
    open
    :title="t('recommendations.configuration.title')"
    :description="t('recommendations.configuration.description')"
    :dismissible="false"
    :class-footer="styles.recommendation.configuration.footer"
  >
    <ProductConfig
      v-if="!meta?.isLoading"
      :item="pendingProduct"
      :model-value="pendingProduct?.id"
      :no-footer="true"
      as="div"
      @resolve="doResolve"
      @reject="doReject"
    />

    <template #close>
      <Button
        @click="doReject"
        :label="t('recommendations.configuration.actions.reject')"
        variant="link"
        color="primary"
      />
    </template>

    <template #actions>
      <Button
        :loading="meta.isProcessing"
        :disabled="meta.isProcessing"
        @click="doResolve"
        :label="t('recommendations.configuration.actions.resolve')"
        prependIcon="plus-circle"
        color="primary"
      />
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRecommendationsEngine,
  useBasketProductsPending,
} from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../recommendations.config";

// --- components
import ProductConfig from "../../product/components/config/Config.vue";
import { Button, Drawer } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
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

const { cancel } = useRecommendationsEngine();
const { configure, resolve } = useBasketProductsPending();
const {
  meta,
  stop,
  update,
  isReady,
  service: pendingProduct,
} = await configure(props.modelValue);
await isReady();

// ---
const styles = useStyles(
  ["recommendation.configuration"],
  {},
  config
) as ComputedRef<{
  recommendation: {
    configuration: {
      footer: string;
    };
  };
}>;
// ---

function doResolve() {
  update().then(() => {
    resolve(pendingProduct);
    emit("resolve");
  });
}

function doReject() {
  cancel();
  stop();
  emit("reject");
}
</script>
