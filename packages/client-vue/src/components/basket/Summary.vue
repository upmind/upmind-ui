<template>
  <aside :class="styles.basket.summary.root">
    <div :class="styles.basket.summary.content">
      <header :class="styles.basket.summary.header">
        <h3 :class="styles.basket.summary.title">
          {{ $t("basket.summary.title") }}
        </h3>
      </header>

      <!-- products -->
      <dl :class="styles.basket.summary.list" v-if="summary?.products?.length">
        <template v-for="product in summary.products" :key="product.id">
          <dt
            :class="
              mergeStyles(
                styles.basket.summary.heading,
                styles.basket.summary.text
              )
            "
          >
            {{ product?.name }}
          </dt>

          <dd
            :class="
              mergeStyles(
                styles.basket.summary.value,
                styles.basket.summary.actions
              )
            "
          >
            <slot name="actions" v-bind="{ ...$props, product }">
              <strong :class="styles.basket.summary.bold" v-if="noActions">
                {{ product.total }}<br />
                <!-- <small>{{ product.quantity }}</small> -->
              </strong>

              <template v-else>
                <upw-button
                  type="button"
                  size="sm"
                  class="!p-0"
                  color="current"
                  icon-only
                  label="modify product"
                  prependIcon="edit"
                  @click="$emit('edit', product.id)"
                  disabled
                />
                <upw-button
                  type="button"
                  size="sm"
                  class="!p-0"
                  color="current"
                  icon-only
                  label="remove product"
                  prependIcon="remove"
                  @click="removeItem(product.id)"
                />
              </template>
            </slot>
          </dd>
        </template>
      </dl>

      <!-- promotions -->
      <upm-promotions :class="styles.basket.summary.form" />

      <!-- subtotals -->
      <dl :class="styles.basket.summary.list">
        <dt :class="styles.basket.summary.heading">
          <span :class="styles.basket.summary.text">{{
            $tc("basket.summary.discount.title", products.length)
          }}</span>
          <!-- TODO -->
          <!-- <upw-icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ $t("basket.summary.discount.tooltip") }}
          </p> -->
        </dt>

        <dd :class="styles.basket.summary.value">{{ summary?.discount }}</dd>

        <dt :class="styles.basket.summary.heading">
          <span :class="styles.basket.summary.text">{{
            $tc("basket.summary.taxes.title", products.length)
          }}</span>
          <!-- TODO -->
          <!-- <upw-icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ $t("basket.summary.taxes.tooltip") }}
          </p> -->
        </dt>

        <dd :class="styles.basket.summary.value">{{ summary?.taxes }}</dd>
      </dl>

      <!-- total -->
      <dl :class="styles.basket.summary.list">
        <dt
          :class="
            mergeStyles(
              styles.basket.summary.heading,
              styles.basket.summary.total
            )
          "
        >
          {{ $t("basket.summary.total") }}
        </dt>
        <dd
          :class="
            mergeStyles(
              styles.basket.summary.value,
              styles.basket.summary.total
            )
          "
        >
          {{ summary?.total }}
        </dd>
      </dl>
    </div>

    <footer :class="styles.basket.summary.footer">
      <div :class="styles.basket.summary.actions">
        <upw-button
          :disabled="!meta.isReadyForCheckout || meta.isProcessing"
          @click.prevent="checkout"
          color="primary"
          block
          :label="$t('basket.summary.actions.submit')"
        />
      </div>

      <p
        v-for="(content, index) in $tm('basket.summary.footer')"
        :key="`footer-content-${index}`"
        :class="styles.basket.summary.text"
      >
        <upw-icon
          v-if="$rt(content?.icon)"
          :class="styles.basket.summary.icon"
          :icon="$rt(content?.icon)"
        />
        <span>{{ $rt(content.text) }}</span>
      </p>
    </footer>
  </aside>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- components
import { UpwButton, UpwIcon } from "@upmind/upwind";
import UpmPromotions from "./Promotions.vue";
// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- utils

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketSummary",
  components: { UpwButton, UpwIcon, UpmPromotions },

  emits: ["edit"],
  props: {
    noActions: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { meta, checkout, removeItem, products, summary } = useBasket();

    const styles = useStyles(["basket.summary"], meta, config);

    return {
      meta,
      products,
      summary,
      checkout,
      removeItem,
      // ---
      styles,
      mergeStyles,
    };
  },
  methods: {},
});
</script>
