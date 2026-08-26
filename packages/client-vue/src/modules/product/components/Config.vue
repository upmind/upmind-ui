<template>
  <component
    :is="props.as"
    :class="cn(productConfigRootVariants(), props.class)"
    @submit.prevent
    @reset.prevent
  >
    <!-- content -->
    <div :class="productConfigContentVariants()" v-if="product?.productDetails">
      <!-- fields -->
      <div :class="productConfigFieldsVariants(stylesMeta)">
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
          @valid="onFormValid"
          @resolve="doResolve"
          no-actions
          as="fieldset"
        />
      </div>
    </div>

    <!-- footer -->
    <footer
      :class="productConfigFooterVariants()"
      v-if="!meta.isLoading && !props.noFooter"
    >
      <slot name="footer">
        <Link
          type="reset"
          tabindex="1"
          :disabled="meta.isProcessing || required"
          size="md"
          color="muted"
          @click="doReject"
          >{{ t("action.cancel") }}</Link
        >

        <span
          :class="productConfigItemtotalVariants(stylesMeta)"
          v-if="product?.price?.regularAmount"
        >
          <span>{{ t("text.total") }}</span>
          <strong :class="productConfigBoldVariants(stylesMeta)">
            {{ product?.price?.regularPrice }}
          </strong>
        </span>

        <Button
          type="submit"
          tabindex="0"
          :loading="meta.isProcessing"
          :disabled="meta.isLoading"
          variant="primary"
          size="lg"
          @click="doResolve"
        >
          {{ t("action.add_to_basket") }}
        </Button>
      </slot>
    </footer>
  </component>
</template>

<script lang="ts" setup>
import { isLayout } from "@jsonforms/core";
import { cn } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { computed, inject, onUpdated, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  type UseProductConfig,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import Form from "../../../components/form/Form.vue";
import {
  productConfigRootVariants,
  productConfigContentVariants,
  productConfigFieldsVariants,
  productConfigFooterVariants,
  productConfigItemtotalVariants,
  productConfigBoldVariants
} from "../variants";
import { assign, isEmpty, isEqual, omit, pick, reject } from "lodash-es";
import type { ConfigProps } from "../types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const emit = defineEmits(["reject", "resolve"]);

const isValid = ref(true);

const props = withDefaults(defineProps<ConfigProps>(), {
  resolveFields: () => [],
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
  // A valid form resolves through autosave, so only force an invalid one — and
  // only for these fields. Compared against the model the form was rendered
  // from, before it is set.
  const resolves =
    !isValid.value &&
    !isEmpty(props.resolveFields) &&
    !isEqual(
      pick(data, props.resolveFields),
      pick(model.value, props.resolveFields)
    );

  setConfig(props.hideTerms ? { ...data, term: model.value?.term } : data);
  if (resolves) emit("resolve", { forced: true });
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

// ---
function doReject() {
  reset();
  emit("reject");
}

function onFormValid(valid: boolean) {
  isValid.value = valid;
}

function doResolve() {
  emit("resolve", { forced: false });
}

onUpdated(() => {
  // Temp debug trick to see how many times we are triggered per config change
  // console.debug("Config updated");
});
</script>
