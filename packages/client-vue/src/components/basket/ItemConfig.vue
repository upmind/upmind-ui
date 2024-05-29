<template>
  <aside :class="styles.basket.itemConfig.root">
    <figure :class="styles.basket.itemConfig.media">
      <img
        :src="
          available?.product?.image?.full_url || $t('basket.itemConfig.image')
        "
        :alt="`${available.product.name} thumbnail`"
        :class="styles.basket.itemConfig.image"
      />
      <!-- <upw-icon
        v-else
        icon="image"
        :class="styles.basket.itemConfig.image"
        :aria-label="`${available.product.name} product image`"
      /> -->
    </figure>
    <div :class="styles.basket.itemConfig.wrapper">
      <header :class="styles.basket.itemConfig.header">
        <slot name="header" v-bind="{ meta, product: available.product }">
          <upw-badge
            color="primary"
            v-if="available?.product?.hasFreeTrial"
            :label="$t('basket.itemConfig.trail')"
          />

          <upw-badge
            color="primary"
            v-if="available?.product?.isOnPromotion"
            :label="$t('basket.itemConfig.promotion')"
          />

          <h3 :class="styles.basket.itemConfig.title">
            {{ available?.product?.name }}
          </h3>

          <p :class="styles.basket.itemConfig.meta">
            <template
              v-if="model.term?.billing_cycle_months && summary.details?.length"
            >
              <strong>{{ summary.details[0].formatted }}</strong>

              {{
                $t(
                  `basket.itemConfig.${summary.details[0].key}`,
                  summary.details[0]
                )
              }}
            </template>

            <upw-button
              variant="link"
              @click="toggle = !toggle"
              size="sm"
              color="base"
              :label="$tc('basket.itemConfig.more', toggle ? 0 : 1)"
              v-if="meta.isConfigurable && meta.isConfigured"
            >
              <template #append-icon>
                <upw-icon
                  icon="arrow-down"
                  :class="styles.basket.itemConfig.toggle"
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
          mergeStyles(
            styles.basket.itemConfig.content,
            styles.basket.itemConfig.collapsible
          )
        "
        :id="`basket-item-${available.product.id}-toggle`"
        :aria-expanded="toggle"
        :aria-hidden="!toggle"
      >
        <slot v-bind="{ meta, product: available.product, summary }">
          <ul :class="styles.basket.itemConfig.details.root">
            <template
              v-for="(detail, index) in summary.details"
              :key="`summary-detail-${index}`"
            >
              <li
                :class="styles.basket.itemConfig.details.item"
                v-if="detail.key != 'term'"
              >
                <strong :class="styles.basket.itemConfig.details.title">
                  {{ detail.category }}
                </strong>
                <span :class="styles.basket.itemConfig.details.text">
                  {{ detail.name }}
                </span>
              </li>
            </template>
          </ul>
          <!-- <p
          :class="styles.basket.itemConfig.text"
          v-if="available?.product?.description"
        >
          {{ available.product.description }}
        </p>

        <p
          :class="styles.basket.itemConfig.text"
          v-if="available?.product?.short_description"
        >
          {{ available.product.short_description }}
        </p> -->
        </slot>
      </div>

      <!-- footer -->
      <footer :class="styles.basket.itemConfig.footer">
        <aside :class="styles.basket.itemConfig.summary">
          <span
            v-if="!!summary?.discount"
            :class="styles.basket.itemConfig.discount"
          >
            {{ summary?.subtotal_formatted }}
          </span>

          <strong :class="styles.basket.itemConfig.total">
            {{
              summary?.total
                ? summary?.total_formatted
                : $t("basket.itemConfig.free")
            }}
          </strong>
        </aside>

        <!-- actions -->
        <div :class="styles.basket.itemConfig.actions">
          <slot name="actions" v-bind="{ meta }"> </slot>
        </div>
      </footer>
    </div>
  </aside>
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
  name: "UpmBasketItemConfig",
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

    const styles = useStyles(
      ["basket.itemConfig", "basket.itemConfig.details"],
      meta,
      config
    );

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
