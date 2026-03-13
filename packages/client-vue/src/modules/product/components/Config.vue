<template>
  <component
    :is="props.as"
    :class="cn(styles.product.config.root, props.class)"
    @submit.prevent
    @reset.prevent
  >
    <!-- content -->
    <div :class="styles.product.config.content" v-if="product?.productDetails">
      <!-- fields -->
      <div :class="cn(styles.product.config.fields)">
        <Form
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :disabled="meta.isProcessing"
          :schema="schema"
          :uischema="filteredUischema"
          :model-value="model"
          :additional-errors="additionalErrors"
          :touched="meta.showErrors"
          @update:modelValue="setConfig"
          no-actions
          as="fieldset"
        />
      </div>
    </div>

    <!-- footer -->
    <footer
      :class="styles.product.config.footer"
      v-if="!meta.isLoading && !props.noFooter"
    >
      <slot name="footer">
        <Link
          type="reset"
          tabindex="1"
          :label="t('action.cancel')"
          :disabled="meta.isProcessing || required"
          size="lg"
          color="muted"
          @click="doReject"
        />

        <span
          :class="styles.product.config.itemtotal"
          v-if="product?.price?.regularAmount"
        >
          <span>{{ t("text.total") }}</span>
          <strong :class="styles.product.config.bold">
            {{ product?.price?.regularPrice }}
          </strong>
        </span>

        <Button
          type="submit"
          tabindex="0"
          :label="t('action.add_to_basket')"
          :loading="meta.isProcessing"
          :disabled="meta.isLoading"
          color="primary"
          size="lg"
          @click="doResolve"
        />
      </slot>
    </footer>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed, inject, onUpdated } from "vue";
import { filter, reject } from "lodash-es";

// --- internal
import {
  type UseProductConfig,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import { useStyles, Link, Button, cn } from "@upmind-automation/upmind-ui";
import config from "../product.config";

// --- components
import Form from "../../../components/form/Form.vue";

// --- utils

// --- types
import type { ConfigProps } from "../types";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const emit = defineEmits(["reject", "resolve"]);

const props = withDefaults(defineProps<ConfigProps>(), {
  as: "form",
  disabled: false,
  required: false,
  class: "",
  noHeader: false,
  noFooter: false
});

const productConfig = inject<UseProductConfig>("useProductConfig");
if (!productConfig)
  throw new DetailedError(
    t("error.product_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );

const {
  product,
  schema,
  uischema,
  additionalErrors,
  model,
  meta,
  // ---
  setConfig,
  reset
} = productConfig;

const { ui } = props.meta;

// TODO: @Rhod convert /extend this to be ui meta
const filteredUischema = computed(() => {
  if (!props.hideTerms || !uischema.value) return uischema.value;

  return {
    ...uischema.value,
    elements: reject((uischema.value as any).elements, [
      "scope",
      "#/properties/term"
    ])
  };
});

const stylesMeta = computed(() => {
  return {
    ...meta.value,
    divide: ui.optionGroupDividers.value,
    spacing: ui.optionGroupSpacing.value
  };
});

const styles = useStyles(
  ["product.config", "product.config.form", "product.config.list"],
  stylesMeta,
  config
);

// ---
function doReject() {
  reset();
  emit("reject");
}

function doResolve() {
  emit("resolve");
}

onUpdated(() => {
  // Temp debug trick to see how many times we are triggered per config change
  // console.debug("Config updated");
});
</script>
