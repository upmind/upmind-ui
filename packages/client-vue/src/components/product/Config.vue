<template>
  <pre>{{ { meta } }}</pre>
  <form :class="styles.product.config.root" @submit.prevent="doResolve">
    <header
      :class="styles.product.config.header"
      v-if="!meta.isLoading && !!$slots.header"
    >
      <slot name="header"></slot>
    </header>

    <!-- content -->
    <div :class="styles.product.config.content">
      <figure :class="styles.product.config.media" v-if="productImage">
        <img
          :src="productImage"
          :alt="`${product?.name} thumbnail`"
          :class="styles.product.config.image"
        />
      </figure>

      <div :class="styles.product.config.wrapper">
        <!-- heading -->
        <div :class="styles.product.config.heading">
          <div :class="styles.product.config.headingContent">
            <upw-badge
              color="secondary"
              v-if="product?.hasFreeTrial"
              :label="$t('product.trail')"
            />

            <upw-badge
              color="promotion"
              v-if="product?.isOnPromotion"
              :label="$t('product.promotion')"
            />

            <h3 :class="styles.product.config.title">
              {{ product?.name }}
            </h3>
          </div>

          <div :class="styles.product.config.summary">
            <!-- quantity -->

            <upw-spinner
              v-if="meta.isLoading || meta.isCalculating"
              size="sm"
            />

            <upw-quantitybox
              v-if="product?.canChangeQuantity"
              :disabled="meta.isProcessing"
              :min="product?.min_order_quantity"
              :max="product?.max_order_quantity"
              :step="product?.unit_quantity"
              :model-value="model?.quantity || product?.unit_quantity"
              @update:modelValue="updateQuantity"
              size="lg"
            />

            <span :class="styles.product.config.price">
              <span
                v-if="!!summary?.discount"
                :class="styles.product.config.discount"
              >
                {{
                  summary?.subtotal
                    ? summary?.subtotal_formatted
                    : $t("product.free")
                }}
              </span>

              <strong
                :class="styles.product.config.total"
                v-if="!isNil(summary?.total)"
              >
                {{
                  summary?.total ? summary?.total_formatted : $t("product.free")
                }}
              </strong>
            </span>
          </div>

          <upw-lineclamp
            :class="styles.product.config.text"
            :lines="2"
            :labelMore="$tc('product.actions.more', 1)"
            :labelLess="$tc('product.actions.more', 0)"
          >
            <upw-markdown
              v-if="product?.description"
              :model-value="product.description"
            />
          </upw-lineclamp>

          <upw-lineclamp
            :class="styles.product.config.text"
            :lines="2"
            labelMore=""
            labelLess=""
          >
            <upw-markdown
              v-if="product?.short_description"
              :model-value="product.short_description"
            />
          </upw-lineclamp>
        </div>

        <!-- fields -->
        <div :class="mergeStyles(styles.product.config.fields)">
          <!-- terms -->
          <upm-config-grid
            v-if="meta.hasTerms"
            :errors="errors?.term"
            :items="terms"
            :label="$t('product.terms.label')"
            :model-value="model?.term?.billing_cycle_months || 0"
            :processing="meta.isProcessing || meta.isLoading"
            @update:modelValue="updateTerm"
            itemKey="billing_cycle_months"
          />

          <!-- options -->
          <upm-config-nested
            v-if="meta.hasOptions"
            :errors="errors?.options"
            :items="options"
            :model-value="model?.options"
            :processing="meta.isProcessing || meta.isLoading"
            @update:modelValue="selectOption"
            @update:quantity="updateOptionQuantity"
            itemKey="product_id"
          />

          <!-- attributes -->
          <upm-config-nested
            v-if="meta.hasAttributes"
            :errors="errors?.attributes"
            :items="attributes"
            :model-value="model?.attributes"
            :processing="meta.isProcessing || meta.isLoading"
            @update:modelValue="selectAttribute"
            itemKey="product_id"
          />

          <!-- provisional fields -->
          <upm-config-form
            v-if="meta.hasProvisioning"
            :processing="meta.isProcessing || meta.isLoading"
            :additional-errors="errors?.provision_fields?.data"
            :fields="getProvisioningFields()"
            :model-value="model.provision_fields"
            @update:modelValue="setProvisioningFields"
          />
        </div>
      </div>
    </div>

    <!-- footer -->
    <footer :class="styles.product.config.footer" v-if="!meta.isLoading">
      <upw-button
        type="reset"
        tabindex="1"
        :label="$t('product.actions.reject')"
        :disabled="meta.isProcessing"
        @click="doReject"
        color="current"
        variant="link"
        v-if="!required"
      />

      <span :class="styles.product.config.itemtotal" v-if="summary?.total">
        <span>{{ $t("product.total") }}</span>
        <strong :class="styles.product.config.bold">
          {{ summary?.total_formatted }}
        </strong>
      </span>

      <upw-button
        type="submit"
        tabindex="0"
        :label="$t('product.actions.resolve')"
        :loading="meta.isProcessing"
        :disabled="meta.isLoading || !meta.isConfigured"
      />
    </footer>
  </form>
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
  UpwMarkdown,
  UpwLineclamp,
} from "@upmind/upwind";
import UpmConfigGrid from "./ConfigGrid.vue";
import UpmConfigNested from "./ConfigNested.vue";
import UpmConfigForm from "./ConfigForm.vue";

// --- utils
import { isNil } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfig",
  inheritAttrs: false,
  components: {
    UpwBadge,
    UpwButton,
    UpwQuantitybox,
    UpwSpinner,
    UpmConfigGrid,
    UpmConfigNested,
    UpmConfigForm,
    UpwMarkdown,
    UpwLineclamp,
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
    required: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const {
      lookups,
      // ---
      product,
      terms,
      options,
      attributes,
      fields,
      // ---
      errors,
      model,
      meta,
      summary,
      // ---
      updateQuantity,
      updateTerm,
      // ---
      updateAttributes,
      selectAttribute,
      // ---
      updateOptions,
      selectOption,
      updateOptionQuantity,
      // ---
      getProvisioningFields,
      setProvisioningFields,
      updateProvisioning,
      getProvisioningField,
      reset,
    } = useProductConfig(props.item);

    const styles = useStyles(["product.config"], meta, config);

    // ---

    return {
      lookups,
      // ---
      product,
      terms,
      options,
      attributes,
      fields,
      // ---
      errors,
      model,
      meta,
      summary,
      // ---
      updateQuantity,
      updateTerm,
      // ---
      updateAttributes,
      selectAttribute,
      // ---
      updateOptions,
      selectOption,
      updateOptionQuantity,
      // ---
      getProvisioningFields,
      setProvisioningFields,
      updateProvisioning,
      getProvisioningField,
      // ---
      doReject: () => {
        reset();
        emit("reject", props.modelValue);
      },
      doResolve: () => emit("resolve", props.modelValue), // ---
      styles,
      mergeStyles,
      // ---
      isNil,
    };
  },
  computed: {
    productImage() {
      if (!this.product?.image?.full_url) return null;
      const url = new URL(this.product.image.full_url);
      url.searchParams.set("size", "400x400");
      return url.toString();
    },
  },
});
</script>
.
