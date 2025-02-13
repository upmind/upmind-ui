<template>
  <component
    :is="as"
    :class="cn(styles.product.config.root, $props.class)"
    @submit.prevent
    @reset.prevent
  >
    <header
      :class="styles.product.config.header"
      v-if="!meta.isLoading && $slots.header && !props.noHeader"
    >
      <slot name="header"></slot>
    </header>

    <!-- content -->
    <div :class="styles.product.config.content">
      <!-- thumb -->
      <figure :class="styles.product.config.media" v-if="productImage()">
        <img
          :src="productImage()"
          :alt="`${product?.name} thumbnail`"
          :class="styles.product.config.image"
        />
      </figure>

      <!-- details -->
      <div
        :class="styles.product.config.wrapper"
        v-if="
          !props.noTitle ||
          product?.hasFreeTrial ||
          product?.isOnPromotion ||
          !!product?.description ||
          !!product?.excerpt
        "
      >
        <!-- heading -->
        <div :class="styles.product.config.heading">
          <div
            :class="styles.product.config.headingContent"
            v-if="
              !props.noTitle || product?.hasFreeTrial || product?.isOnPromotion
            "
          >
            <h3 :class="styles.product.config.title" v-if="!props.noTitle">
              {{ product?.name }}
            </h3>

            <Badge
              v-if="product?.hasFreeTrial"
              color="secondary"
              :label="t('product.trail')"
              variant="tonal"
            />

            <Badge
              v-if="product?.isOnPromotion"
              color="promotion"
              :label="t('product.promotion')"
              variant="tonal"
              size="sm"
            />
          </div>

          <Lineclamp
            :class="styles.product.config.text"
            :lines="2"
            :labelMore="t('product.actions.more', 1)"
            :labelLess="t('product.actions.more', 0)"
            v-if="product?.description"
          >
            <Markdown :model-value="product.description" />
          </Lineclamp>

          <Lineclamp
            :class="styles.product.config.text"
            :lines="2"
            labelMore=""
            labelLess=""
            v-if="product?.excerpt"
          >
            <Markdown :model-value="product.excerpt" />
          </Lineclamp>
        </div>
      </div>

      <!-- fields -->
      <div :class="cn(styles.product.config.fields)">
        <!-- terms -->
        <component
          v-if="meta.hasTerms"
          :is="getTermsComponent"
          :errors="errors?.term"
          :items="terms"
          :label="t('product.terms.label')"
          :model-value="model?.term"
          :processing="meta.isProcessing || meta.isLoading"
          @update:modelValue="updateTerm"
          required
          :monthly="meta.hasMonthlyTerms"
        />

        <!-- options -->
        <SubproductCards
          v-for="option in options"
          :key="option.id"
          :subproduct="option"
          :model-value="getValue('options', option)"
          :errors="getErrors('options', option)"
          :quantities="getQuantities(option)"
          @update:modelValue="setOptions(option, safeValue(option, $event))"
          @update:quantity="
            (value, qty) => updateOptionQuantity(option, value, qty)
          "
          :required="option.required"
          :visible="!!option.values?.length"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="props.disabled || meta.isLoading || meta.isProcessing"
        />

        <!-- attributes -->
        <SubproductCards
          v-for="attribute in attributes"
          :key="attribute.id"
          :subproduct="attribute"
          :model-value="getValue('attributes', attribute)"
          :errors="getErrors('attributes', attribute)"
          :required="attribute.required"
          :visible="!!attribute.values?.length"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="
            props.disabled ||
            meta.isLoading ||
            meta.isProcessing ||
            meta.isCalculating
          "
          @update:modelValue="
            setAttributes(attribute, safeValue(attribute, $event))
          "
        />

        <!-- provisional fields -->
        <ConfigForm
          v-if="meta.hasProvisioning"
          :processing="meta.isProcessing || meta.isLoading"
          :additional-errors="errors?.provisionFields?.data"
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
          :label="t('product.actions.reject')"
          :disabled="meta.isProcessing || required"
          color="current"
          variant="link"
          @click="doReject"
        />

        <span :class="styles.product.config.itemtotal" v-if="summary?.total">
          <span>{{ t("product.total") }}</span>
          <strong :class="styles.product.config.bold">
            {{ summary?.regularPrice }}
          </strong>
        </span>

        <Button
          type="submit"
          tabindex="0"
          :label="t('product.actions.resolve')"
          :loading="meta.isProcessing"
          :disabled="meta.isLoading || meta.isCalculating || meta.isInvalid"
          color="secondary"
          @click="doResolve"
        />
      </slot>
    </footer>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- internal
import { useProductConfig } from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../config.cva";

// --- components
import { Markdown, Lineclamp } from "@upmind-automation/upmind-ui";
import TermsConfigGrid from "../terms/TermsConfigGrid.vue";
import TermsConfigSelect from "../terms/TermsConfigSelect.vue";
import SubproductCards from "../subproduct/SubproductCards.vue";
import ConfigForm from "./ConfigForm.vue";

// --- custom elements
import { Badge, Button } from "@upmind-automation/upmind-ui";

// --- utils
import { reduce, get, first, isArray, set, keys } from "lodash-es";

// -- -types
import type { ActorRef } from "xstate";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const emit = defineEmits(["reject", "resolve"]);

const props = withDefaults(
  defineProps<{
    as?: string;
    modelValue: string;
    item: ActorRef<any, any>;
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
    noFooter: false,
  }
);

const { t } = useI18n();

const {
  product,
  productImage,
  terms,
  options,
  attributes,
  fields,
  // ---
  errors,
  model,
  meta,
  summary,
  updateTerm,
  setAttributes,
  setOptions,
  updateOptionQuantity,
  setProvisioningFields,
  reset,
} = useProductConfig(props.item);

const styles = useStyles(["product.config"], meta, config);

function safeValue(subproduct: Object, value: any): string | string[] {
  const shouldBeArray = subproduct?.multiple || subproduct?.values?.length == 1;
  const safeArray = !isArray(value) ? [value] : value;
  const safeString = isArray(value) ? first(value) : value;
  const safeValue = shouldBeArray ? safeArray : safeString;
  return safeValue || "";
}

const getTermsComponent = computed(() => {
  // TODO: Can we do this in a lookup?
  const control =
    product?.value?.meta?.uischema?.billing?.control ||
    product?.value?.categoryMeta?.uischema?.billing?.control;

  return control === "TermsConfigSelect" ? TermsConfigSelect : TermsConfigGrid;
});

function getValue(
  type: "options" | "attributes",
  subproduct: Object
): string | string[] {
  const value = keys(model.value?.[type]?.[subproduct.id]);
  return safeValue(subproduct, value);
}

function getQuantities(subproduct: Object): Record<string, number> {
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

  return value;
}

function getErrors(type: "options" | "attributes", subproduct: Object) {
  //  prevent error message from showing if the field has not been touched
  if (!meta.value.isTouched) return undefined;

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
</script>
