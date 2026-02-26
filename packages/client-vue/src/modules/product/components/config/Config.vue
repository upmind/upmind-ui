<template>
  <component
    :is="as"
    :class="cn(styles.product.config.root, $props.class)"
    @submit.prevent
    @reset.prevent
  >
    <!-- content -->
    <div :class="styles.product.config.content" v-if="product?.productDetails">
      <!-- fields -->
      <div :class="cn(styles.product.config.fields)">
        <!-- terms -->
        <component
          v-if="meta.hasTerms && !hideTerms"
          :class="styles.product.config.field"
          :is="getTermsComponent"
          :type="ui.termSelector.value"
          :columns="ui.termSelectorGrid.asNumber"
          :errors="errors?.term"
          :touched="meta.showErrors"
          :items="terms ?? []"
          :label="t('term.label')"
          :model-value="model?.term"
          :summary="ui.termSelectorSummary.isVisible"
          :processing="meta.isProcessing || meta.isLoading"
          @update:modelValue="updateTerm"
          required
        />

        <!-- options -->
        <SubproductCards
          v-for="option in options"
          :key="option.id"
          :class="styles.product.config.field"
          :subproduct="option"
          :meta="props.meta"
          :model-value="keys(model?.['options']?.[option.id])"
          :errors="getErrors('options', option)"
          :touched="meta.showErrors"
          :quantities="getQuantities(option)"
          :term="model?.term"
          @update:modelValue="setOptions(option, $event)"
          @update:quantity="
            (value: string, qty: number) =>
              updateOptionQuantity(option, value, qty)
          "
          :optional-text="t('text.optional')"
          :required="option.meta.required"
          :visible="!!option.values?.length"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="props.disabled || meta.isLoading || meta.isProcessing"
        />

        <!-- attributes -->
        <SubproductCards
          v-for="attribute in attributes"
          :key="attribute.id"
          :class="styles.product.config.field"
          :subproduct="attribute"
          :meta="props.meta"
          :model-value="keys(model?.['attributes']?.[attribute.id])"
          :errors="getErrors('attributes', attribute)"
          :touched="meta.showErrors"
          :term="model?.term"
          :required="attribute.meta.required"
          :visible="!!attribute.values?.length"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="props.disabled || meta.isLoading || meta.isProcessing"
          @update:modelValue="setAttributes(attribute, $event)"
        />

        <!-- provisional fields -->
        <ConfigForm
          v-if="meta.hasProvisioning"
          :class="styles.product.config.field"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="meta.isProcessing"
          :additional-errors="additionalErrors?.provisionFields"
          :touched="meta.showErrors"
          :fields="fields"
          :model-value="model?.provisionFields"
          @update:modelValue="setProvisioningFields"
        />
      </div>
    </div>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed, inject, onUpdated } from "vue";

// --- internal
import {
  type UseProductConfig,
  type UseMetaResult
} from "@upmind-automation/headless";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import TermsConfigRadio from "../terms/TermsConfigRadio.vue";
import TermsConfigSelect from "../terms/TermsConfigSelect.vue";
import SubproductCards from "../subproduct/SubproductCards.vue";
import ConfigForm from "./ConfigForm.vue";

// --- utils
import { reduce, get, set, keys } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const emit = defineEmits(["reject", "resolve"]);

const props = withDefaults(
  defineProps<{
    as?: string;
    disabled?: boolean;
    required?: boolean;
    hideTerms?: boolean;
    class?: HTMLAttributes["class"];
    meta: UseMetaResult;
  }>(),
  {
    as: "form",
    disabled: false,
    required: false,
    class: "",
    noHeader: false,
    noFooter: false
  }
);

const productConfig = inject<UseProductConfig>("useProductConfig");
if (!productConfig) throw new Error("useProductConfig not provided");

const {
  product,
  terms,
  options,
  attributes,
  fields,
  // ---
  errors,
  additionalErrors,
  model,
  meta,
  updateTerm,
  setAttributes,
  setOptions,
  updateOptionQuantity,
  setProvisioningFields,
  reset
} = productConfig;

const { ui } = props.meta;

const stylesMeta = computed(() => {
  return {
    ...meta.value,
    divide: ui.optionGroupDividers.value,
    spacing: ui.optionGroupSpacing.value
  };
});

const styles = useStyles(["product.config"], stylesMeta, config);

const getTermsComponent = computed(() => {
  return ui.termSelector.isSelect ? TermsConfigSelect : TermsConfigRadio;
});

function getQuantities(subproduct: any): Record<string, number> {
  const value = reduce(
    model.value?.options?.[subproduct.id],
    (result: Record<string, number>, value, productId) => {
      if (productId) {
        set(result, productId, get(value, "quantity"));
      }
      return result;
    },
    {}
  );

  // console.debug("getQuantities", subproduct.id);
  return value;
}

function getErrors(type: "options" | "attributes", subproduct: any) {
  //  prevent error message from showing if the field has not been touched
  if (!meta.value.isTouched && !meta.value.showErrors) return undefined;

  return errors.value?.[type]?.[subproduct?.id]?.join() || undefined;
}

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
