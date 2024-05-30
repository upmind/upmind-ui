<template>
  <article :class="styles.product.card.root">
    <!-- thumb -->
    <figure :class="styles.product.card.media">
      <img
        :src="availableProduct?.image?.full_url || $t('product.image')"
        :alt="`${availableProduct?.name} thumbnail`"
        :class="styles.product.card.image"
      />
    </figure>

    <div :class="styles.product.card.wrapper">
      <!-- header -->
      <header :class="styles.product.card.header">
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

        <h3 :class="styles.product.card.title">
          {{ availableProduct?.name }}
        </h3>

        <div :class="styles.product.card.meta">
          <span
            v-if="model.term?.billing_cycle_months && summary.details?.length"
          >
            <strong :class="styles.product.card.bold">{{
              summary.details[0].formatted
            }}</strong>

            {{ $t(`product.${summary.details[0].key}`, summary.details[0]) }}
          </span>

          <upw-button
            variant="link"
            @click="toggle = !toggle"
            size="sm"
            color="current"
            :label="$tc('product.actions.more', toggle ? 0 : 1)"
            v-if="meta.isConfigurable && meta.isConfigured"
          >
            <template #append-icon>
              <upw-icon
                icon="arrow-down"
                :class="styles.product.card.toggle"
                :aria-checked="toggle"
                :aria-controls="`product-${availableProduct?.id}-toggle`"
                aria-hidden="true"
              />
            </template>
          </upw-button>
        </div>
      </header>

      <!-- content -->
      <div
        :class="
          mergeStyles(
            styles.product.card.content,
            styles.product.card.collapsible
          )
        "
        :id="`product-${availableProduct?.id}-toggle`"
        :aria-expanded="toggle"
        :aria-hidden="!toggle"
      >
        <ul :class="styles.product.card.details.root">
          <template
            v-for="(detail, index) in summary.details"
            :key="`summary-detail-${index}`"
          >
            <li
              :class="styles.product.card.details.item"
              v-if="detail.key != 'term'"
            >
              <strong :class="styles.product.card.details.title">
                {{ detail.category }}
              </strong>
              <span :class="styles.product.card.details.text">
                {{ detail.name }}
              </span>
            </li>
          </template>
        </ul>
      </div>

      <!-- footer -->
      <footer :class="styles.product.card.footer" v-show="!meta.isLoading">
        <div :class="styles.product.card.summary">
          <span
            v-if="!!summary?.discount"
            :class="styles.product.card.discount"
          >
            {{ summary?.subtotal_formatted }}
          </span>

          <strong :class="styles.product.card.total">
            {{ summary?.total ? summary?.total_formatted : $t("product.free") }}
          </strong>
        </div>

        <!-- actions -->
        <div :class="styles.product.card.actions">
          <upw-button
            :disabled="!meta.isConfigurable"
            :label="$t('product.actions.configure')"
            @click="doResolve"
            color="current"
            icon-only
            prependIcon="edit"
            type="button"
          />
          <upw-button
            :label="$t('product.actions.remove')"
            @click="doReject"
            color="current"
            icon-only
            prependIcon="remove"
            type="button"
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
import { useProductConfig } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwBadge, UpwButton, UpwIcon } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductCard",
  components: { UpwBadge, UpwButton, UpwIcon },
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
    const { availableProduct, model, meta, summary } = useProductConfig(
      props.item
    );

    const styles = useStyles(
      ["product.card", "product.card.details"],
      meta,
      config
    );

    // ---

    return {
      availableProduct,
      model,
      meta,
      summary,
      // ---
      doReject: () => emit("reject", { id: props.modelValue }),
      doResolve: () => emit("resolve", { id: props.modelValue }),
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
