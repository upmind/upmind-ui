<template>
  <article :class="styles.product.card.root">
    <!-- thumb -->
    <figure :class="styles.product.card.media" v-if="product?.image?.full_url">
      <img
        :src="product?.image?.full_url"
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
          :label="$t('product.trail')"
        />

        <Badge
          color="promotion"
          v-if="product?.isOnPromotion"
          :label="$t('product.promotion')"
        />

        <h3 :class="styles.product.card.title">
          <span>{{ product?.name }}</span>
          <span v-if="product?.service_identifier">
            ({{ product?.service_identifier }})
          </span>

          <slot name="badges"></slot>
        </h3>

        <div :class="styles.product.card.meta">
          <span v-if="termSummary">
            {{ $t(`product.${termSummary.key}`, termSummary) }}
          </span>

          <Button
            variant="link"
            @click="toggle = !toggle"
            size="sm"
            color="current"
            :label="$tc('product.actions.more', toggle ? 0 : 1)"
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
                :label="$t('product.actions.invalid')"
                @click="doResolve"
              />
            </li>
          </template>
        </ul>
      </div>

      <!-- footer -->
      <footer :class="styles.product.card.footer">
        <UpwSpinner v-if="meta.isLoading || meta.isCalculating" size="sm" />
        <div :class="styles.product.card.summary">
          <span
            v-if="!!summary?.discount"
            :class="styles.product.card.discount"
          >
            {{
              summary?.subtotal
                ? summary?.subtotal_formatted
                : $t("product.free")
            }}
          </span>

          <strong
            :class="styles.product.card.total"
            v-if="!isNil(summary?.total)"
          >
            {{ summary?.total ? summary?.total_formatted : $t("product.free") }}
          </strong>
        </div>

        <!-- actions -->
        <div :class="styles.product.card.actions">
          <Button
            :disabled="
              meta.isLoading ||
              meta.isCalculating ||
              meta.isProcessing ||
              (!meta.isConfigurable && !product?.canChangeQuantity)
            "
            :color="
              meta.isNew ? 'accent' : meta.hasErrors ? 'error' : 'current'
            "
            :label="$t('product.actions.configure')"
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
            :label="$t('product.actions.remove')"
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

// --- internal
import { useProductConfig } from "@upmind/headless-vue";
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwSpinner } from "@upmind/upwind";

// --- custom elements
import { Icon, Badge, Button } from "@upmind/upwind";

// --- utils
import { isNil, find, reject } from "lodash-es";
// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductCard",
  components: { UpwSpinner, Icon, Badge, Button },
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
    const { state, product, model, meta, summary } = useProductConfig(
      props.item
    );

    const styles = useStyles(
      ["product.card", "product.card.details"],
      meta,
      config
    );

    // ---

    return {
      state,
      product,
      model,
      meta,
      summary,
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
