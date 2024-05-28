<template>
  <article :class="styles.basket.item.root">
    <figure :class="styles.basket.item.media">
      <img
        :src="available?.product?.image?.full_url || $t('basket.item.image')"
        :alt="`${available.product.name} thumbnail`"
        :class="styles.basket.item.image"
      />
      <!-- <upw-icon
        v-else
        icon="image"
        :class="styles.basket.item.image"
        :aria-label="`${available.product.name} product image`"
      /> -->
    </figure>

    <header :class="styles.basket.item.header">
      <slot name="header" v-bind="{ meta, product: available.product }">
        <upw-badge
          color="primary"
          v-if="available?.product?.hasFreeTrial"
          :label="$t('basket.item.trail')"
        />

        <upw-badge
          color="primary"
          v-if="available?.product?.isOnPromotion"
          :label="$t('basket.item.promotion')"
        />

        <h3 :class="styles.basket.item.title">
          {{ available.product.name }}
        </h3>

        <p
          v-if="model?.term?.billing_cycle_months"
          :class="styles.basket.item.details"
        >
          <strong>{{ model.term.price_formatted }}</strong>

          {{ $t("basket.item.term", model.term) }}

          <upw-button
            variant="link"
            @click="toggle = !toggle"
            size="sm"
            color="base"
            :label="$t('basket.item.more')"
            v-if="meta.isConfigurable && meta.isConfigured"
          >
            <template #append-icon>
              <upw-icon
                icon="arrow-down"
                :class="styles.basket.item.toggle"
                :aria-checked="toggle"
                :aria-controls="`basket-item-${available.product.id}-toggle`"
                aria-hidden="true"
              />
            </template>
          </upw-button>
        </p>
      </slot>
    </header>

    <!-- content -->
    <div
      :class="
        mergeStyles(styles.basket.item.content, styles.basket.item.collapsible)
      "
      :id="`basket-item-${available.product.id}-toggle`"
      :aria-expanded="toggle"
      :aria-hidden="!toggle"
    >
      <slot v-bind="{ meta, product: available.product }">
        <p
          :class="styles.basket.item.text"
          v-if="available?.product?.description"
        >
          {{ available.product.description }}
        </p>

        <p
          :class="styles.basket.item.text"
          v-if="available?.product?.short_description"
        >
          {{ available.product.short_description }}
        </p>
      </slot>
      <!-- <pre>{{ available }}</pre> -->
    </div>

    <!-- footer -->
    <footer :class="styles.basket.item.footer">
      <aside :class="styles.basket.item.summary">
        <span v-if="!!summary?.discount" :class="styles.basket.item.discount">
          {{ summary?.subtotalFormatted }}
        </span>

        <strong :class="styles.basket.item.total">
          {{
            summary?.total ? summary?.totalFormatted : $t("basket.item.free")
          }}
        </strong>
      </aside>

      <!-- actions -->
      <div :class="styles.basket.item.actions">
        <slot name="actions" v-bind="{ meta }"> </slot>
      </div>
    </footer>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useProductConfig } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwBadge, UpwButton, UpwIcon } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketItemCard",
  components: { UpwBadge, UpwButton, UpwIcon },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    item: {
      type: Object, // xstate actor
      required: true,
    },
    processing: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
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
      incrementQuantity,
      decrementQuantity,
      // ---
      updateTerm,
      isSelectedTerm,
      // ---
      updateAttributes,
      isSelectedAttribute,
      selectAttribute,
      incrementAttribute,
      decrementAttribute,
      // ---
      updateOptions,
      isSelectedOption,
      selectOption,
      incrementOption,
      decrementOption,
      // ---
      getProvisioningFields,
      setProvisioningFields,
      updateProvisioning,
      getProvisioningField,
    } = useProductConfig(props.item);

    const remove = () => emit("remove", { itemId: props.modelValue });

    const styles = useStyles(["basket.item"], meta, config);

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
      incrementQuantity,
      decrementQuantity,
      // ---
      updateTerm,
      isSelectedTerm,
      // ---
      updateAttributes,
      isSelectedAttribute,
      selectAttribute,
      incrementAttribute,
      decrementAttribute,
      // ---
      updateOptions,
      isSelectedOption,
      selectOption,
      incrementOption,
      decrementOption,
      // ---
      getProvisioningFields,
      setProvisioningFields,
      updateProvisioning,
      getProvisioningField,
      // ---
      remove,
      toggle: ref(false),
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
});
</script>
.
