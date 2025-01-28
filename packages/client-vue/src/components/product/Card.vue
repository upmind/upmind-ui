<template>
  <article :class="styles.product.card.root">
    <!-- thumb -->
    <figure :class="styles.product.card.media" v-if="productImage()">
      <img
        :src="productImage()"
        :alt="`${product?.name} thumbnail`"
        :class="styles.product.card.image"
      />
    </figure>

    <div :class="styles.product.card.wrapper">
      <!-- header -->
      <header :class="styles.product.card.header">
        <Badge
          color="secondary"
          v-if="product?.hasFreeTrial"
          :label="t('product.trail')"
          variant="flat"
        />

        <Badge
          color="promotion"
          v-if="product?.isOnPromotion"
          :label="t('product.promotion')"
          variant="tonal"
        />

        <h3 :class="styles.product.card.title">
          <span>{{ product?.name }}</span>
          <span v-if="product?.serviceIdentifier">
            ({{ product?.serviceIdentifier }})
          </span>

          <slot name="badges"></slot>
        </h3>

        <div :class="styles.product.card.meta">
          <span v-if="termSummary">
            {{ t(`product.${termSummary.key}`, termSummary) }}
          </span>

          <Button
            variant="link"
            @click="toggle = !toggle"
            size="sm"
            color="current"
            :label="t('product.actions.more', toggle ? 0 : 1)"
            :class="styles.product.card.more"
            v-if="hasSummaryDetails"
          >
            <template #append>
              <Icon
                icon="arrow-down"
                :class="styles.product.card.toggle"
                :aria-checked="toggle"
                :aria-controls="`product-${product?.id}-toggle`"
                aria-hidden="true"
              />
            </template>
          </Button>
        </div>
      </header>

      <!-- content -->
      <div
        :class="
          cn(styles.product.card.content, styles.product.card.collapsible)
        "
        :id="`product-${product?.id}-toggle`"
        :aria-expanded="toggle"
        :aria-hidden="!toggle"
      >
        <ul :class="styles.product.card.details.root">
          <template
            v-for="(detail, index) in summary?.details"
            :key="`summary-detail-${index}`"
          >
            <li
              :class="styles.product.card.details.item"
              v-if="detail.key != 'term'"
            >
              <strong
                :class="
                  cn(
                    styles.product.card.details.title,
                    detail.invalid ? styles.product.card.details.invalid : ''
                  )
                "
              >
                {{ detail.category }}
              </strong>
              <span
                :class="styles.product.card.details.text"
                v-if="detail.name"
              >
                {{ detail.name }}
              </span>
              <Button
                v-else-if="detail.invalid"
                size="xs"
                variant="link"
                :label="t('product.actions.invalid')"
                @click="doResolve"
              />
            </li>
          </template>
        </ul>
      </div>

      <!-- footer -->
      <footer :class="styles.product.card.footer">
        <Spinner v-if="meta.isLoading || meta.isCalculating" size="sm" />
        <div :class="styles.product.card.summary">
          <span
            v-if="summary?.meta?.discounted"
            :class="styles.product.card.discount"
          >
            {{ summary?.regularPrice }}
          </span>

          <strong :class="styles.product.card.total">
            {{
              summary?.meta?.free ? t("product.free") : summary?.currentPrice
            }}
          </strong>
        </div>

        <!-- actions -->
        <div :class="styles.product.card.actions">
          <Button
            :disabled="
              meta.isLoading ||
              meta.isCalculating ||
              meta.isProcessing ||
              (!meta.isConfigurable && !product?.quantifiable)
            "
            :color="
              meta.isNew ? 'accent' : meta.hasErrors ? 'error' : 'current'
            "
            :label="t('product.actions.configure')"
            @click="doResolve"
            icon-only
            prependIcon="edit"
            type="button"
            :variant="meta.hasErrors || meta.isNew ? 'flat' : 'ghost'"
          />

          <Button
            :disabled="
              meta.isLoading || meta.isCalculating || meta.isProcessing
            "
            :label="t('product.actions.remove')"
            :loading="meta.isProcessing"
            @click="doReject"
            color="current"
            icon-only
            prependIcon="remove"
            type="button"
            variant="ghost"
          />
        </div>
      </footer>
    </div>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useProductConfig } from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import { Spinner } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Icon, Badge, Button } from "@upmind-automation/upmind-ui";

// --- utils
import { isNil, find, reject } from "lodash-es";
// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "ProductCard",
  components: { Spinner, Icon, Badge, Button },
  emits: ["reject", "resolve"],
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    item: {
      type: Object, // xstate actor
      required: true,
    },
  },
  setup(props, { emit }) {
    const { t } = useI18n();

    const { state, product, productImage, model, meta, summary } =
      useProductConfig(props.item);

    const styles = useStyles(
      ["product.card", "product.card.details"],
      meta,
      config
    );

    // ---

    return {
      t,
      state,
      product,
      model,
      meta,
      summary,
      productImage,
      // ---
      doReject: () => emit("reject", props.modelValue),
      doResolve: () => emit("resolve", props.modelValue),
      toggle: ref(meta.value.hasErrors && !meta.value.isNew),
      // ---
      styles,
      cn,
      // ---
      isNil,
    };
  },
  computed: {
    termSummary() {
      return find(this?.summary?.details, detail => detail.key === "term");
    },
    hasSummaryDetails() {
      return reject(this?.summary?.details, ["key", "term"])?.length;
    },
  },

  watch: {
    "meta.hasErrors": {
      immediate: true,
      handler(value) {
        this.toggle = value && !this.meta.isNew;
      },
    },
  },
});
</script>
.
