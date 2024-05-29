<template>
  <article :class="styles.basket.item.root">
    <!-- thumb -->
    <figure :class="styles.basket.item.media">
      <img
        :src="availableProduct?.image?.full_url || $t('basket.item.image')"
        :alt="`${availableProduct.name} thumbnail`"
        :class="styles.basket.item.image"
      />
    </figure>

    <div :class="styles.basket.item.wrapper">
      <!-- header -->
      <header :class="styles.basket.item.header">
        <upw-badge
          color="primary"
          v-if="availableProduct?.hasFreeTrial"
          :label="$t('basket.item.trail')"
        />

        <upw-badge
          color="primary"
          v-if="availableProduct?.isOnPromotion"
          :label="$t('basket.item.promotion')"
        />

        <h3 :class="styles.basket.item.title">
          {{ availableProduct?.name }}
        </h3>

        <div :class="styles.basket.item.meta">
          <span
            v-if="model.term?.billing_cycle_months && summary.details?.length"
          >
            <strong :class="styles.basket.item.bold">{{
              summary.details[0].formatted
            }}</strong>

            {{
              $t(`basket.item.${summary.details[0].key}`, summary.details[0])
            }}
          </span>

          <upw-button
            variant="link"
            @click="toggle = !toggle"
            size="sm"
            color="current"
            :label="$tc('basket.item.more', toggle ? 0 : 1)"
            v-if="meta.isConfigurable && meta.isConfigured"
          >
            <template #append-icon>
              <upw-icon
                icon="arrow-down"
                :class="styles.basket.item.toggle"
                :aria-checked="toggle"
                :aria-controls="`basket-item-${availableProduct.id}-toggle`"
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
            styles.basket.item.content,
            styles.basket.item.collapsible
          )
        "
        :id="`basket-item-${availableProduct.id}-toggle`"
        :aria-expanded="toggle"
        :aria-hidden="!toggle"
      >
        <ul :class="styles.basket.item.details.root">
          <template
            v-for="(detail, index) in summary.details"
            :key="`summary-detail-${index}`"
          >
            <li
              :class="styles.basket.item.details.item"
              v-if="detail.key != 'term'"
            >
              <strong :class="styles.basket.item.details.title">
                {{ detail.category }}
              </strong>
              <span :class="styles.basket.item.details.text">
                {{ detail.name }}
              </span>
            </li>
          </template>
        </ul>
      </div>

      <!-- footer -->
      <footer :class="styles.basket.item.footer">
        <div :class="styles.basket.item.summary">
          <span v-if="!!summary?.discount" :class="styles.basket.item.discount">
            {{ summary?.subtotal_formatted }}
          </span>

          <strong :class="styles.basket.item.total">
            {{
              summary?.total ? summary?.total_formatted : $t("basket.item.free")
            }}
          </strong>
        </div>

        <!-- actions -->
        <div :class="styles.basket.item.actions">
          <upw-button
            type="button"
            color="current"
            icon-only
            label="modify product"
            prependIcon="edit"
            @click="doResolve"
          />
          <upw-button
            type="button"
            color="current"
            icon-only
            label="remove product"
            prependIcon="remove"
            @click="doReject"
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
  name: "UpmBasketItemCard",
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
      ["basket.item", "basket.item.details"],
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
