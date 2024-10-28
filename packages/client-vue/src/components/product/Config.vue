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
      <div :class="styles.product.config.wrapper">
        <!-- heading -->
        <div :class="styles.product.config.heading">
          <div :class="styles.product.config.headingContent">
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

            <h3 :class="styles.product.config.title">
              {{ product?.name }}
            </h3>
          </div>

          <!-- <div :class="styles.product.config.summary"> -->
          <!-- quantity -->

          <!-- <Spinner v-if="meta.isLoading || meta.isCalculating" size="sm" /> -->

          <!-- <NumberField
              v-if="product?.canChangeQuantity"
              :disabled="meta.isProcessing"
              :min="product?.min_order_quantity"
              :max="product?.max_order_quantity"
              :step="product?.unit_quantity"
              :model-value="model?.quantity || product?.unit_quantity"
              @update:modelValue="updateQuantity"
              width="md"
            /> -->

          <!-- <span :class="styles.product.config.price">
              <span
                v-if="!!summary?.discount"
                :class="styles.product.config.discount"
              >
                {{
                  summary?.subtotal
                    ? summary?.subtotal_formatted
                    : t("product.free")
                }}
              </span>

              <strong
                :class="styles.product.config.total"
                v-if="!isNil(summary?.total)"
              >
                {{
                  summary?.total ? summary?.total_formatted : t("product.free")
                }}
              </strong>
            </span> -->
          <!-- </div> -->

          <Lineclamp
            :class="styles.product.config.text"
            :lines="2"
            :labelMore="t('product.actions.more', 1)"
            :labelLess="t('product.actions.more', 0)"
          >
            <Markdown
              v-if="product?.description"
              :model-value="product.description"
            />
          </Lineclamp>

          <Lineclamp
            :class="styles.product.config.text"
            :lines="2"
            labelMore=""
            labelLess=""
          >
            <Markdown
              v-if="product?.short_description"
              :model-value="product.short_description"
            />
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

        <!-- options -->
        <SubproductConfigNested
          v-if="meta.hasOptions"
          :errors="errors?.options"
          :items="options"
          :model-value="model?.options"
          :processing="meta.isProcessing || meta.isLoading"
          @update:modelValue="setOptions"
          @update:quantity="updateOptionQuantity"
          itemKey="product_id"
        />

        <!-- attributes -->
        <SubproductConfigNested
          v-if="meta.hasAttributes"
          :errors="errors?.attributes"
          :items="attributes"
          :model-value="model?.attributes"
          :processing="meta.isProcessing || meta.isLoading"
          @update:modelValue="setAttributes"
          itemKey="product_id"
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
import SubproductConfigNested from "./SubproductConfigNested.vue";
import ConfigForm from "./ConfigForm.vue";

// --- custom elements
import { Badge, Button } from "@upmind/upwind";

// --- utils

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    as: string;
    modelValue: string;
    item: ActorRef<any, any>;
    disabled?: boolean;
    required?: boolean;
    noHeader?: boolean;
    noFooter?: boolean;
    class?: hasAttributes["class"];
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

// ---
function doReject() {
  reset();
  emit("reject", props.modelValue);
}

function doResolve() {
  emit("resolve", props.modelValue);
}
</script>
