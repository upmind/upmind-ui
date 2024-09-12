<template>
  <uw-dialog
    size="xl"
    :model-value="modelValue"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.basket.processing.root">
      <uw-avatar
        :avatar="avatar"
        :class="styles.basket.processing.avatar"
        :loading="true"
      />

      <h3 :class="styles.basket.processing.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.processing.text">{{ text }}</p>

      <footer :class="styles.basket.processing.actions">
        <uw-button
          v-if="hasAction"
          v-bind="action"
          block
          variant="ghost"
          @click.stop="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </uw-dialog>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwAvatar, UwButton, UwDialog, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar);
useCustomElement(UwButton);
useCustomElement(UwDialog);

// ---utils
import { isEmpty } from "lodash-es";
// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketProcessing",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { meta, invoice } = useBasket();
    const styles = useStyles(["basket.processing"], meta, config);

    // ---

    return {
      meta,
      invoice,
      processing: ref(false),
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      if (this.meta.needsApproval) {
        return this.$t("basket.processing.approval.title");
      }

      if (this.meta.isConverting) {
        return this.$t("basket.processing.converting.title");
      }

      if (this.meta.isPaying) {
        return this.$t("basket.processing.paying.title");
      }

      if (this.meta.isCheckout) {
        return this.$t("basket.processing.default.title");
      }

      return this.$t("basket.processing.invalid.title");
    },

    text() {
      if (this.meta.needsApproval) {
        return this.$t("basket.processing.approval.text");
      }

      if (this.meta.isConverting) {
        return this.$t("basket.processing.converting.text");
      }

      if (this.meta.isPaying) {
        return this.$t("basket.processing.paying.text");
      }

      if (this.meta.isCheckout) {
        return this.$t("basket.processing.default.text");
      }

      return this.$t("basket.processing.invalid.text");
    },

    avatar() {
      if (this.meta.needsApproval) {
        return this.$tm("basket.processing.approval.avatar");
      }

      if (this.meta.isConverting) {
        return this.$tm("basket.processing.converting.avatar");
      }

      if (this.meta.isPaying) {
        return this.$tm("basket.processing.paying.avatar");
      }

      if (this.meta.isCheckout) {
        return this.$tm("basket.processing.default.avatar");
      }

      return this.$tm("basket.processing.invalid.avatar");
    },

    action() {
      return this.$tm("basket.processing.invalid.actions.complete");
    },

    hasAction() {
      return !isEmpty(this.action);
    },

    storefrontUrl() {
      return import.meta.env.VITE_APP_UPMIND_STOREFRONT;
    },
  },

  methods: {
    doAction() {},
  },
});
</script>
.
