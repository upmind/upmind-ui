<template>
  <upw-dialog size="xl" :model-value="open" no-actions persistent skrim="light">
    <section :class="styles.basket.confirmation.root">
      <upw-avatar :avatar="avatar" :class="styles.basket.confirmation.avatar" />

      <h3 :class="styles.basket.confirmation.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.confirmation.text">{{ text }}</p>
    </section>
  </upw-dialog>
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwDialog, UpwAvatar } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketConfirmation",
  components: {
    UpwDialog,
    UpwAvatar,
  },
  props: {},
  setup() {
    const { meta } = useBasket();

    const styles = useStyles(["basket.confirmation"], meta, config);

    // ---

    return {
      meta,
      open: computed(() => {
        const value = meta.value.isProcessingOrder || meta.value.isComplete;
        return value;
      }),

      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      if (this.meta.isComplete) {
        return this.$t("basket.confirmation.complete.title");
      }

      if (this.meta.needsApproval) {
        return this.$t("basket.confirmation.approval.title");
      }

      if (this.meta.isConverting) {
        return this.$t("basket.confirmation.converting.title");
      }

      if (this.meta.isPaying) {
        return this.$t("basket.confirmation.paying.title");
      }

      if (this.meta.isCheckout) {
        return this.$t("basket.confirmation.default.title");
      }

      return this.$t("basket.confirmation.invalid.title");
    },

    text() {
      if (this.meta.isComplete) {
        return this.$t("basket.confirmation.complete.text");
      }

      if (this.meta.needsApproval) {
        return this.$t("basket.confirmation.approval.text");
      }

      if (this.meta.isConverting) {
        return this.$t("basket.confirmation.converting.text");
      }

      if (this.meta.isPaying) {
        return this.$t("basket.confirmation.paying.text");
      }

      if (this.meta.isCheckout) {
        return this.$t("basket.confirmation.default.text");
      }

      return this.$t("basket.confirmation.invalid.text");
    },

    avatar() {
      if (this.meta.isComplete) {
        return this.$tm("basket.confirmation.complete.avatar");
      }

      if (this.meta.needsApproval) {
        return this.$tm("basket.confirmation.approval.avatar");
      }

      if (this.meta.isConverting) {
        return this.$tm("basket.confirmation.converting.avatar");
      }

      if (this.meta.isPaying) {
        return this.$tm("basket.confirmation.paying.avatar");
      }

      if (this.meta.isCheckout) {
        return this.$tm("basket.confirmation.default.avatar");
      }

      return this.$tm("basket.confirmation.invalid.avatar");
    },
  },
});
</script>
.
