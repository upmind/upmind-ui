<template>
  <aside :class="styles.basket.summary.root">
    <div :class="styles.basket.summary.content">
      <header :class="styles.basket.summary.header">
        <h3 :class="styles.basket.summary.title">
          {{ t("basket.summary.title") }}
        </h3>
      </header>

      <!-- products -->
      <dl
        :class="styles.basket.summary.list"
        v-if="summary?.products?.length"
        v-auto-animate
      >
        <template v-for="product in summary.products" :key="product.id">
          <dt
            :class="
              cn(styles.basket.summary.heading, styles.basket.summary.text)
            "
          >
            <span>{{ product?.name }}</span>
            <span v-if="product?.service_identifier">
              ({{ product?.service_identifier }})
            </span>
          </dt>

          <dd
            :class="
              cn(styles.basket.summary.value, styles.basket.summary.actions)
            "
          >
            <slot name="actions" v-bind="{ ...$props, product }">
              <strong :class="styles.basket.summary.bold" v-if="noActions">
                <del
                  :class="styles.basket.summary.discount"
                  v-if="!!product.discount"
                >
                  {{ product.subtotal }}
                  <!-- <small>{{ product.quantity }}</small> -->
                </del>

                {{ product.total }}
                <!-- <small>{{ product.quantity }}</small> -->
              </strong>

              <template v-else>
                <Button
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
                <Button
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
      <Promotions :class="styles.basket.summary.form" />

      <!-- subtotals -->
      <dl
        :class="styles.basket.summary.list"
        v-if="!!summary?.discount || !!summary?.taxes"
        v-auto-animate
      >
        <template v-if="summary?.discount">
          <dt :class="styles.basket.summary.heading">
            <span :class="styles.basket.summary.text">{{
              t("basket.summary.discount.title", products.length)
            }}</span>
            <!-- TODO -->
            <!-- <icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ t("basket.summary.discount.tooltip") }}
          </p> -->
          </dt>

          <dd :class="styles.basket.summary.value">{{ summary.discount }}</dd>
        </template>

        <template v-if="summary?.subtotal">
          <dt :class="styles.basket.summary.heading">
            <span :class="styles.basket.summary.text">{{
              t("basket.summary.subtotal.title", products.length)
            }}</span>
            <!-- TODO -->
            <!-- <icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ t("basket.summary.discount.tooltip") }}
          </p> -->
          </dt>

          <dd :class="styles.basket.summary.value">{{ summary.subtotal }}</dd>
        </template>

        <template v-for="(value, key) in summary?.taxes" :key="key">
          <dt :class="styles.basket.summary.heading">
            <span :class="styles.basket.summary.text">{{ key }}</span>
            <!-- TODO -->
            <!-- <icon
            :class="styles.basket.summary.tooltipIcon"
            icon="information-circle-alt"
          />
          <p :class="styles.basket.summary.tooltip">
            {{ t("basket.summary.taxes.tooltip") }}
          </p> -->
          </dt>

          <dd :class="styles.basket.summary.value">{{ value }}</dd>
        </template>
      </dl>

      <!-- total -->
      <dl :class="styles.basket.summary.list">
        <dt
          :class="
            cn(styles.basket.summary.heading, styles.basket.summary.total)
          "
        >
          {{ t("basket.summary.total") }}
        </dt>
        <dd
          :class="cn(styles.basket.summary.value, styles.basket.summary.total)"
        >
          {{ summary?.total }}
        </dd>
      </dl>
    </div>

    <footer :class="styles.basket.summary.footer" v-auto-animate>
      <div :class="styles.basket.summary.actions">
        <Button
          :disabled="!meta.isReadyForCheckout || meta.isProcessing"
          @click.prevent="checkout"
          class="w-full"
          color="primary"
          block
          :label="t('basket.summary.actions.submit')"
        />
      </div>

      <p
        v-for="(content, index) in tm('basket.summary.footer')"
        :key="`footer-foreground-${index}`"
        :class="styles.basket.summary.text"
      >
        <Icon
          v-if="rt(content?.icon)"
          :class="styles.basket.summary.icon"
          :icon="rt(content?.icon)"
        />
        <span>{{ rt(content.text) }}</span>
      </p>
    </footer>
  </aside>
</template>

<script>
// --- external
import { defineComponent } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- components
import Promotions from "./Promotions.vue";

// --- custom elements
import { Icon, Button } from "@upmind-automation/upwind";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upwind";
import config from "./config.cva";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "BasketSummary",
  components: { Promotions, Icon, Button },
  directives: { autoAnimate: vAutoAnimate },
  emits: ["edit"],
  props: {
    noActions: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { t, tm, rt } = useI18n();

    const { meta, checkout, removeItem, products, summary } = useBasket();

    const styles = useStyles(["basket.summary"], meta, config);

    return {
      t,
      tm,
      rt,
      meta,
      products,
      summary,
      checkout,
      removeItem,
      // ---
      styles,
      cn,
    };
  },
  methods: {},
});
</script>
