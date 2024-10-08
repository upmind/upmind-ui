<template>
  <form
    :class="cn(styles.product.config.root, $props.class)"
    @submit.prevent="doResolve"
  >
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
            <Badge
              v-if="product?.hasFreeTrial"
              color="secondary"
              :label="$t('product.trail')"
            />

            <Badge
              v-if="product?.isOnPromotion"
              color="promotion"
              :label="$t('product.promotion')"
            />

            <h3 :class="styles.product.config.title">
              {{ product?.name }}
            </h3>
          </div>

          <div :class="styles.product.config.summary">
            <!-- quantity -->

            <Spinner v-if="meta.isLoading || meta.isCalculating" size="sm" />

            <UpwQuantitybox
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

          <UpwLineclamp
            :class="styles.product.config.text"
            :lines="2"
            :labelMore="$tc('product.actions.more', 1)"
            :labelLess="$tc('product.actions.more', 0)"
          >
            <UpwMarkdown
              v-if="product?.description"
              :model-value="product.description"
            />
          </UpwLineclamp>

          <UpwLineclamp
            :class="styles.product.config.text"
            :lines="2"
            labelMore=""
            labelLess=""
          >
            <UpwMarkdown
              v-if="product?.short_description"
              :model-value="product.short_description"
            />
          </UpwLineclamp>
        </div>

        <!-- fields -->
        <div :class="cn(styles.product.config.fields)">
          <!-- terms -->
          <UpmConfigGrid
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
          <UpmConfigNested
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
          <UpmConfigNested
            v-if="meta.hasAttributes"
            :errors="errors?.attributes"
            :items="attributes"
            :model-value="model?.attributes"
            :processing="meta.isProcessing || meta.isLoading"
            @update:modelValue="setAttributes"
            itemKey="product_id"
          />

          <!-- provisional fields -->
          <UpmConfigForm
            v-if="meta.hasProvisioning"
            :processing="meta.isProcessing || meta.isLoading"
            :additional-errors="errors?.provision_fields?.data"
            :fields="fields"
            :model-value="model.provision_fields"
            @update:modelValue="setProvisioningFields"
          />
        </div>
      </div>
    </div>

    <!-- footer -->
    <footer :class="styles.product.config.footer" v-if="!meta.isLoading">
      <Button
        type="reset"
        tabindex="1"
        :label="$t('product.actions.reject')"
        :disabled="meta.isProcessing || required"
        @click="doReject"
        color="current"
        variant="link"
      />

      <span :class="styles.product.config.itemtotal" v-if="summary?.total">
        <span>{{ $t("product.total") }}</span>
        <strong :class="styles.product.config.bold">
          {{ summary?.total_formatted }}
        </strong>
      </span>

      <Button
        type="submit"
        tabindex="0"
        :label="$t('product.actions.resolve')"
        :loading="meta.isProcessing"
        :disabled="meta.isLoading || !meta.isConfigured"
        color="secondary"
      />
    </footer>
  </form>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useProductConfig } from "@upmind/headless-vue";
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import {
  UpwQuantitybox,
  Spinner,
  UpwMarkdown,
  UpwLineclamp,
} from "@upmind/upwind";
import UpmConfigGrid from "./ConfigGrid.vue";
import UpmConfigNested from "./ConfigNested.vue";
import UpmConfigForm from "./ConfigForm.vue";

// --- custom elements
import { Badge, Button } from "@upmind/upwind";

// --- utils
import { isNil } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfig",
  inheritAttrs: false,
  components: {
    Badge,
    Button,
    UpwQuantitybox,
    Spinner,
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
    class: {
      type: String,
      default: "",
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
      setAttributes,
      // ---
      updateOptions,
      setOptions,
      updateOptionQuantity,
      // ---
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
      setAttributes,
      // ---
      updateOptions,
      setOptions,
      updateOptionQuantity,
      // ---
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
      cn,
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
