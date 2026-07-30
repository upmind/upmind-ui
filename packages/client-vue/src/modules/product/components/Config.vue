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
          :dataAttrs="{ 'data-test-key': 'product-config-form' }"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :disabled="meta.isProcessing"
          :schema="schema"
          :uischema="filteredUischema"
          :model-value="model"
          :additional-errors="additionalErrors"
          :touched="props.touched"
          :autosave="props.autosave"
          @update:modelValue="onConfigChange"
          @resolve="doResolve"
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
import { computed, inject, onUpdated } from "vue";
import { useI18n } from "vue-i18n";
import { assign, filter, omit, reject } from "lodash-es";
import { isLayout } from "@jsonforms/core";
import {
  type UseProductConfig,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import { useStyles, Link, Button, cn } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";
import config from "../product.config";
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

// Under `hide-terms` the term control is removed from the form, so the form's
// internal `term` is never updated when the term changes via the external
// selector — it emits a stale value, leapfrogging the model and looping. Pin
// the term to the model's current value (the selector owns it) so the form
// can't clobber it.
function onConfigChange(data: Parameters<typeof setConfig>[0]) {
  setConfig(props.hideTerms ? { ...data, term: model.value?.term } : data);
}

const { ui } = props.meta;

// TODO: @Rhod convert /extend this to be ui meta
const filteredUischema = computed(() => {
  if (!props.hideTerms || !uischema.value) return uischema.value;
  if (!isLayout(uischema.value)) return uischema.value;

  return assign(omit(uischema.value, "elements"), {
    elements: reject(uischema.value.elements, ["scope", "#/properties/term"])
  });
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
