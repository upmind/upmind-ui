<template>
  <component
    :is="as"
    :class="cn(styles.product.config.root, $props.class)"
    @submit.prevent="doResolve"
    @reset.prevent="doReject"
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
          !noTitle ||
          product?.hasFreeTrial ||
          product?.isOnPromotion ||
          !!product?.description ||
          !!product?.short_description
        "
      >
        <!-- heading -->
        <div :class="styles.product.config.heading">
          <div
            :class="styles.product.config.headingContent"
            v-if="!noTitle || product?.hasFreeTrial || product?.isOnPromotion"
          >
            <Badge
              v-if="product?.hasFreeTrial"
              color="secondary"
              :label="t('product.trail')"
            />

            <Badge
              v-if="product?.isOnPromotion"
              color="promotion"
              :label="t('product.promotion')"
            />

            <h3 :class="styles.product.config.title" v-if="!noTitle">
              {{ product?.name }}
            </h3>
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
            v-if="product?.short_description"
          >
            <Markdown :model-value="product.short_description" />
          </Lineclamp>
        </div>
      </div>

      <!-- fields -->
      <div :class="cn(styles.product.config.fields)">
        <!-- terms -->
        <TermsConfigGrid
          v-if="meta.hasTerms"
          :errors="errors?.term"
          :items="terms"
          :label="t('product.terms.label')"
          :model-value="model?.term?.billing_cycle_months"
          :processing="meta.isProcessing || meta.isLoading"
          @update:modelValue="updateTerm"
          required
        />

        <VSubproductCards
          v-for="option in options"
          :key="option.id"
          :subproduct="option"
          :model-value="getValue('options', option)"
          :errors="getErrors('options', option)"
          @update:modelValue="setOptions(option, safeValue(option, $event))"
          @update:quantity="updateOptionQuantity(option, ...$event)"
          :required="option.required"
          :visible="option.values.length"
          :processing="meta.isProcessing || meta.isLoading"
          :disabled="
            props.disabled ||
            meta.isLoading ||
            meta.isProcessing ||
            meta.isCalculating
          "
        />

        <!-- attributes -->
        <VSubproductCards
          v-for="attribute in attributes"
          :key="attribute.id"
          :subproduct="attribute"
          :model-value="getValue('attributes', attribute)"
          :errors="getErrors('attributes', attribute)"
          :required="attribute.required"
          :visible="attribute.values.length"
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
          :additional-errors="errors?.provision_fields?.data"
          :fields="fields"
          :model-value="model.provision_fields"
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
        />

        <span :class="styles.product.config.itemtotal" v-if="summary?.total">
          <span>{{ t("product.total") }}</span>
          <strong :class="styles.product.config.bold">
            {{ summary?.total_formatted }}
          </strong>
        </span>

        <Button
          type="submit"
          tabindex="0"
          :label="t('product.actions.resolve')"
          :loading="meta.isProcessing"
          :disabled="meta.isLoading || !meta.isConfigured"
          color="secondary"
        />
      </slot>
    </footer>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useProductConfig } from "@upmind/headless-vue";
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Markdown, Lineclamp } from "@upmind/upwind";
import TermsConfigGrid from "./TermsConfigGrid.vue";
import VSubproductCards from "./SubproductCards.vue";
import ConfigForm from "./ConfigForm.vue";

// --- custom elements
import { Badge, Button } from "@upmind/upwind";

// --- utils
import { reduce, get, first, isArray } from "lodash-es";

// -- -types
import type { ActorRef } from "xstate";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const emit = defineEmits(["reject", "resolve"]);

const props = withDefaults(
  defineProps<{
    as: string;
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
  updateQuantity,
  updateTerm,
  setAttributes,
  setOptions,
  updateOptionQuantity,
  setProvisioningFields,
  reset,
} = useProductConfig(props.item);

const styles = useStyles(["product.config"], meta, config);

function safeValue(
  subproduct: Object,
  value: string | string[]
): string | string[] {
  const shouldBeArray = subproduct?.multiple || subproduct?.values?.length == 1;
  const safeArray = !isArray(value) ? [value] : value;
  const safeString = isArray(value) ? first(value) : value;
  const safeValue = shouldBeArray ? safeArray : safeString;
  return safeValue || "";
}

function getValue(
  type: "options" | "attributes",
  subproduct: Object
): string | string[] {
  const value = reduce(
    model.value?.[type]?.[subproduct.id],
    (result: string[], value) => {
      const val: string = get(value, "product_id");
      if (val) result.push(val);
      return result;
    },
    []
  );

  return safeValue(subproduct, value);
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
