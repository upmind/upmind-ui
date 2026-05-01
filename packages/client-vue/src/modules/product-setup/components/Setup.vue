<template>
  <Transitions>
    <component :is="templateVariant" :key="template">
      <template #configuration>
        <slot
          name="configuration"
          :product="product"
          :basket-product="basketProduct"
          :product-meta="productMeta"
        >
          <Section
            :label="setupMeta.isLoading ? '' : currentProductTitle"
            icon="settings-04"
          >
            <form @submit.prevent @reset.prevent>
              <Form
                v-if="
                  basketProduct &&
                  productMeta?.isAvailable &&
                  !setupMeta.isLoading
                "
                :loading="productMeta.isLoading"
                :processing="setupMeta.isProcessing"
                :disabled="setupMeta.isProcessing"
                :schema="schema"
                :uischema="uischema"
                :model-value="model"
                :additional-errors="additionalErrors"
                :touched="productMeta.showErrors"
                @update:modelValue="setConfig"
                no-actions
                as="fieldset"
              />
              <ConfigSkeleton v-else />
            </form>
          </Section>
        </slot>
      </template>

      <template #apply-to-others>
        <slot name="apply-to-others" :other-products="similarProducts">
          <ApplyToOthers
            v-if="setupMeta.hasSimilar"
            v-model="selected"
            :products="similarProducts"
            :loading="setupMeta.isLoading"
            :disabled="setupMeta.isProcessing"
          />
        </slot>
      </template>

      <template #aside>
        <slot name="aside">
          <div class="flex flex-col gap-6">
            <Badge variant="muted" icon="lock-01">
              {{ t("text.fully_encrypted_title") }}
            </Badge>
            <div class="flex flex-col gap-2">
              <h1 class="text-3xl font-semibold">
                {{ t("cart.product_setup.title") }}
              </h1>
              <p class="text-muted-foreground">
                {{ t("cart.product_setup.description") }}
              </p>
            </div>
            <Button
              variant="outline"
              icon="arrow-left"
              :label="t('action.back_to_basket')"
              @click="doReject"
            />
            <slot name="errors">
              <Alert
                v-if="externalErrors?.message || setupMeta?.hasError"
                class="w-full"
                color="danger"
                variant="minimal"
                icon="alert-triangle"
                :title="t('error.product_setup')"
                :description="externalErrors?.message || setupError?.message"
              />
              <ConfigErrors
                v-if="!setupMeta.isLoading"
                :visible="productMeta?.showErrors"
                :errors="validationErrors"
              />
            </slot>
          </div>
        </slot>
      </template>

      <template #progress>
        <slot name="progress">
          <span v-if="total > 1" class="shrink-0 text-base font-semibold">
            {{ t("cart.product_setup.products_remaining", { count: total }) }}
          </span>
        </slot>
      </template>

      <template #actions>
        <slot
          name="actions"
          :do-resolve="doResolve"
          :do-reject="doReject"
          :is-processing="setupMeta?.isProcessing"
        >
          <Button
            v-if="!setupMeta?.isLoading"
            type="submit"
            :label="t('action.continue_label')"
            :loading="setupMeta?.isProcessing"
            :disabled="
              productMeta?.isLoading ||
              productMeta?.isInvalid ||
              productMeta?.isUnavailable ||
              setupMeta?.isProcessing
            "
            color="primary"
            size="lg"
            class="w-full"
            @click="doResolve"
          />
        </slot>
      </template>
    </component>
  </Transitions>
</template>

<script lang="ts" setup>
// --- external
import { computed, defineAsyncComponent, onUnmounted, provide } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductConfig,
  useProductSetup,
  useConfig,
  validateTemplate,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";

// --- components
import { Alert, Badge, Button } from "@upmind-automation/upmind-ui";
import ConfigSkeleton from "../../product/components/ConfigSkeleton.vue";
import ConfigErrors from "../../product/components/ConfigErrors.vue";
import Section from "../../../components/section/Section.vue";
import Form from "../../../components/form/Form.vue";
import ApplyToOthers from "./ApplyToOthers.vue";
import Transitions from "../../../components/layout/components/transition/Transition.vue";

// --- templates
const supportedTemplates = {
  [PRODUCT_SETUP_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("../templates/ProductSetupFull.template.vue")
  ),
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("../templates/ProductSetupLTR.template.vue")
  ),
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("../templates/ProductSetupRTL.template.vue")
  ),
  [PRODUCT_SETUP_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("../templates/ProductSetupEnclosed.template.vue")
  )
};

// --- utils
import { get } from "lodash-es";

// --- types
import { UIContext, type ProductModel } from "@upmind-automation/headless";
import { PRODUCT_SETUP_TEMPLATE, type ProductSetupProps } from "../types";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    ProductSetupProps & {
      bpid: string;
    }
  >(),
  {
    hideSlots: () => []
  }
);

const emit = defineEmits<{
  resolve: [model: Partial<ProductModel>];
  reject: [];
}>();

const { t } = useI18n();

// --- Product Setup composable (singleton - shared with parent)
const {
  configure,
  error: setupError,
  meta: setupMeta,
  schema,
  uischema,
  selected,
  similarProducts,
  total
} = useProductSetup();

const { service: basketProduct, isReady } = await configure(props.bpid);

const basketProductConfig = useProductConfig(basketProduct);

if (!basketProductConfig) {
  doReject();
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
  validationErrors,
  additionalErrors,
  setConfig
} = basketProductConfig;

// --- Config context
const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

await isReady();

const template = computed(() =>
  validateTemplate(
    configMeta.ui.template.value || props.template,
    PRODUCT_SETUP_TEMPLATE,
    PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

const currentProductTitle = computed(() =>
  get(
    product.value,
    "serviceIdentifier",
    get(product.value, "productDetails.title", "")
  )
);

// --- Actions
function doResolve() {
  if (!model.value || productMeta.value.isInvalid) return;
  emit("resolve", model.value);
}

function doReject() {
  emit("reject");
}
</script>
