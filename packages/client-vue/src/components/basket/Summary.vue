<template>
  <aside :class="styles.basket.summary.root">
    <div :class="styles.basket.summary.content">
      <header :class="styles.basket.summary.header">
        <h3 :class="styles.basket.summary.title">
          {{ $t("basket.summary.title") }}
        </h3>
      </header>

      <!-- items -->
      <dl :class="styles.basket.summary.list">
        <dt :class="styles.basket.summary.heading">
          {{ $tc("basket.summary.items.title", items.length) }}
        </dt>

        <dd :class="styles.basket.summary.value">{{ items.length }}</dd>
      </dl>

      <!-- coupons -->
      <!-- <dl :class="styles.basket.summary.list"></dl> -->

      <!-- subtotals -->
      <dl :class="styles.basket.summary.list">
        <dt :class="styles.basket.summary.heading">
          <span :class="styles.basket.summary.text">{{
            $tc("basket.summary.discount.title", items.length)
          }}</span>
          <upw-icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ $t("basket.summary.discount.tooltip") }}
          </p>
        </dt>

        <dd :class="styles.basket.summary.value">{{ summary?.discount }}</dd>

        <dt :class="styles.basket.summary.heading">
          <span :class="styles.basket.summary.text">{{
            $tc("basket.summary.taxes.title", items.length)
          }}</span>
          <upw-icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ $t("basket.summary.taxes.tooltip") }}
          </p>
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
        >
          {{ $t("basket.summary.actions.submit") }}
        </upw-button>
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

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- utils

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasket.summary",
  components: { UpwButton, UpwIcon },
  customOptions: {},
  emits: [],
  props: {},
  setup() {
    const { meta, checkout, items, summary } = useBasket();

    const styles = useStyles(["basket.summary"], meta, config);

    return {
      meta,
      items,
      summary,
      checkout,
      // ---
      styles,
      mergeStyles,
    };
  },
  methods: {},
});
</script>
