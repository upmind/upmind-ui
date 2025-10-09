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
          v-if="meta.hasTerms"
          :is="getTermsComponent"
          :errors="errors?.term"
          :touched="meta.showErrors"
          :items="terms"
          :label="t('term.label')"
          :model-value="model?.term"
          :processing="meta.isProcessing || meta.isLoading"
          @update:modelValue="updateTerm"
          required
        />

        <!-- options -->
        <SubproductCards
          v-for="option in options"
          :key="option.id"
          :subproduct="option"
          :model-value="keys(model?.['options']?.[option.id])"
          :errors="getErrors('options', option)"
          :touched="meta.showErrors"
          :quantities="getQuantities(option)"
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
          :subproduct="attribute"
          :model-value="keys(model?.['attributes']?.[attribute.id])"
          :errors="getErrors('attributes', attribute)"
          :touched="meta.showErrors"
          :required="attribute.meta.required"
          :visible="!!attribute.values?.length"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="props.disabled || meta.isLoading || meta.isProcessing"
          @update:modelValue="setAttributes(attribute, $event)"
        />

        <!-- provisional fields -->
        <ConfigForm
          v-if="meta.hasProvisioning"
          :processing="meta.isProcessing || meta.isLoading"
          :additional-errors="additionalErrors?.provisionFields"
          :touched="meta.showErrors"
          :fields="fields"
          :model-value="model.provisionFields"
          @update:modelValue="setProvisioningFields"
        />
      </div>
    </div>

    <!-- footer -->
    <footer
      :class="styles.product.config.footer"
      v-if="!meta.isLoading && !props.noFooter"
    >
      <slot name="footer">
        <Button
          type="reset"
          tabindex="1"
          :label="t('action.cancel')"
          :disabled="meta.isProcessing || required"
          variant="link"
          size="lg"
          color="muted"
          @click="doReject"
        />

        <span
          :class="styles.product.config.itemtotal"
          v-if="product.price.regularAmount"
        >
          <span>{{ t("text.total") }}</span>
          <strong :class="styles.product.config.bold">
            {{ product.price?.regularPrice }}
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
import { computed, onMounted, onUpdated, watch } from "vue";

// --- internal
import { useProductConfig } from "@upmind-automation/headless";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import TermsConfigGrid from "../terms/TermsConfigGrid.vue";
import TermsConfigSelect from "../terms/TermsConfigSelect.vue";
import SubproductCards from "../subproduct/SubproductCards.vue";
import ConfigForm from "./ConfigForm.vue";

// --- custom elements
import { Button } from "@upmind-automation/upmind-ui";

// --- utils
import { reduce, get, set, keys } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { ComputedRef, HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const emit = defineEmits(["reject", "resolve"]);

const props = withDefaults(
  defineProps<{
    as?: string;
    modelValue: string;
    item: ActorRef<any>;
    disabled?: boolean;
    required?: boolean;
    noHeader?: boolean;
    noTitle?: boolean;
    noFooter?: boolean;
    class?: HTMLAttributes["class"];
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
} = useProductConfig(props.item);

const styles = useStyles(["product.config"], meta, config) as ComputedRef<{
  product: {
    config: {
      root: string;
      header: string;
      content: string;
      media: string;
      image: string;
      wrapper: string;
      heading: string;
      headingContent: string;
      title: string;
      text: string;
      fields: string;
      footer: string;
      itemtotal: string;
      bold: string;
    };
  };
}>;

const getTermsComponent = computed(() => {
  // TODO: Can we do this in a lookup?
  const control =
    product.value.productDetails?.uiMeta?.uischema?.billing?.control ||
    product.value.productDetails?.uiCategoryMeta?.uischema?.billing?.control;
  return control === "TermsConfigSelect" ? TermsConfigSelect : TermsConfigGrid;
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
  emit("reject", props.modelValue);
}

function doResolve() {
  emit("resolve", props.modelValue);
}

onUpdated(() => {
  // Temp debug trick to see how many times we are triggered per config change
  console.debug("Config updated");
});
</script>
