<template>
  <aside :class="styles.product.config.root">
    <figure :class="styles.product.config.media">
      <img
        :src="availableProduct?.image?.full_url || $t('product.image')"
        :alt="`${availableProduct?.name} thumbnail`"
        :class="styles.product.config.image"
      />
    </figure>

    <div :class="styles.product.config.wrapper">
      <header :class="styles.product.config.header">
        <div :class="styles.product.config.headerContent">
          <upw-badge
            color="primary"
            v-if="availableProduct?.hasFreeTrial"
            :label="$t('product.trail')"
          />

          <upw-badge
            color="primary"
            v-if="availableProduct?.isOnPromotion"
            :label="$t('product.promotion')"
          />

          <h3 :class="styles.product.config.title">
            {{ availableProduct?.name }}
          </h3>

          <p
            v-if="availableProduct?.description"
            :class="styles.product.config.text"
          >
            {{ availableProduct.description }}
          </p>

          <p
            v-if="availableProduct?.short_description"
            :class="styles.product.config.text"
          >
            {{ availableProduct.short_description }}
          </p>
        </div>
        <div :class="styles.product.config.summary">
          <!-- quantity -->

          <upw-spinner v-if="loading || meta.isCalculating" size="xs" />

          <upw-quantitybox
            v-if="availableProduct?.canChangeQuantity"
            :disabled="processing"
            :min="availableProduct?.min_order_quantity"
            :max="availableProduct?.max_order_quantity"
            :step="availableProduct?.unit_quantity"
            :model-value="model?.quantity || availableProduct?.unit_quantity"
            @update:modelValue="updateQuantity"
            size="lg"
          />

          <span :class="styles.product.config.price">
            <span
              v-if="!!summary?.discount"
              :class="styles.product.config.discount"
            >
              {{ summary?.subtotal_formatted }}
            </span>

            <strong :class="styles.product.config.total" v-if="summary?.total">
              {{ summary?.total_formatted }}
            </strong>
          </span>
        </div>
      </header>

      <!-- content -->
      <div :class="mergeStyles(styles.product.config.content)">
        <!-- terms -->
        <upm-config-grid
          :disabled="processing || meta.isLoading || meta.isCalculating"
          :items="availableTerms"
          :model-value="model?.term?.billing_cycle_months || 0"
          @update:modelValue="updateTerm"
          :label="$t('product.terms.label')"
          itemKey="billing_cycle_months"
        />

        <!-- attributes -->
        <upm-config-nested
          :disabled="processing || meta.isLoading || meta.isCalculating"
          :items="availableAttributes"
          :model-value="model?.attributes"
          @update:modelValue="selectAttribute"
          itemKey="product_id"
        />

        <!-- options -->
        <upm-config-nested
          :disabled="processing || meta.isLoading || meta.isCalculating"
          :items="availableOptions"
          :model-value="model?.options"
          @update:modelValue="selectOption"
          @update:quantity:increment="incrementOption"
          @update:quantity:decrement="decrementOption"
          itemKey="product_id"
        />

        <!-- provisional fields -->
        <!-- <upm-config-terms
          :disabled="processing || meta.isCalculating"
          :terms="availableTerms"
          :model-value="model?.term?.billing_cycle_months || 0"
          @update:modelValue="updateTerm"
        /> -->
      </div>
    </div>

    <!-- footer -->
    <footer :class="styles.product.config.footer">
      <!-- actions -->
      <upw-button
        :label="$t('product.actions.reject')"
        :disabled="loading || processing"
        @click="doReject"
        color="current"
        variant="link"
      />

      <upw-button
        :label="$t('product.actions.resolve')"
        :loading="processing"
        :disabled="loading"
        @click="doResolve"
      />
    </footer>
  </aside>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useProductConfig } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import {
  UpwBadge,
  UpwButton,
  UpwQuantitybox,
  UpwSpinner,
} from "@upmind/upwind";
import UpmConfigGrid from "./ConfigGrid.vue";
import UpmConfigNested from "./ConfigNested.vue";

// --- utils

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfig",
  components: {
    UpwBadge,
    UpwButton,
    UpwQuantitybox,
    UpwSpinner,
    UpmConfigGrid,
    UpmConfigNested,
  },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    item: {
      type: Object, // xstate actor
      required: true,
    },
    // ---
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    processing: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const {
      available,
      // ---
      availableProduct,
      availableTerms,
      availableOptions,
      availableAttributes,
      availableFields,
      // ---
      errors,
      model,
      meta,
      summary,
      // ---
      clearErrors,
      // ---
      updateQuantity,
      updateTerm,
      // ---
      updateAttributes,
      selectAttribute,
      incrementAttribute,
      decrementAttribute,
      // ---
      updateOptions,
      selectOption,
      incrementOption,
      decrementOption,
      // ---
      getProvisioningFields,
      setProvisioningFields,
      updateProvisioning,
      getProvisioningField,
    } = useProductConfig(props.item);

    const styles = useStyles(["product.config"], meta, config);

    // ---

    return {
      available,
      // ---
      availableProduct,
      availableTerms,
      availableOptions,
      availableAttributes,
      availableFields,
      // ---
      errors,
      model,
      meta,
      summary,
      // ---
      clearErrors,
      // ---
      updateQuantity,
      updateTerm,
      // ---
      updateAttributes,
      selectAttribute,
      incrementAttribute,
      decrementAttribute,
      // ---
      updateOptions,
      selectOption,
      incrementOption,
      decrementOption,
      // ---
      getProvisioningFields,
      setProvisioningFields,
      updateProvisioning,
      getProvisioningField,
      // ---
      doReject: () => emit("reject", { id: props.modelValue }),
      doResolve: () => emit("resolve", { id: props.modelValue }), // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
});
</script>
.
