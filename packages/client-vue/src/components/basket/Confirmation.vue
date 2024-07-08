<template>
  <upw-dialog size="xl" :model-value="open" no-actions persistent skrim="light">
    <section :class="styles.basket.confirmation.root">
      <upw-avatar
        :avatar="avatar"
        :class="styles.basket.confirmation.avatar"
        :loading="!this.meta.isComplete"
      />

      <h3 :class="styles.basket.confirmation.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.confirmation.text">{{ text }}</p>

      <footer>
        <upw-button
          v-if="action"
          v-bind="action"
          block
          variant="ghost"
          @click.prevent="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </upw-dialog>
</template>

<script>
// --- external
import { defineComponent, computed, ref } from "vue";

// --- internal
import { useBasket, useSession, utils } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwDialog, UpwAvatar, UpwButton } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketConfirmation",
  components: {
    UpwDialog,
    UpwAvatar,
    UpwButton,
  },
  props: {},
  setup() {
    const { meta, invoice } = useBasket();
    const { transfer } = useSession();
    const styles = useStyles(["basket.confirmation"], meta, config);

    // ---

    return {
      meta,
      transferSession: transfer,
      invoice,
      processing: ref(false),
      // ---
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

    action() {
      if (this.meta.isComplete) {
        // we have transfer the users session to the Upmind client
        // and then redirect to the order confirmation page on the Upmind client
        const action = this.$tm(
          "basket.confirmation.complete.actions.continue"
        );

        return action;
      }

      // if (this.meta.needsApproval) {
      //   return this.$tm("basket.confirmation.approval.actions.continue");
      // }

      // if (this.meta.isConverting) {
      //   return this.$tm("basket.confirmation.converting.actions.continue");
      // }

      // if (this.meta.isPaying) {
      //   return this.$tm("basket.confirmation.paying.actions.continue");
      // }

      // if (this.meta.isCheckout) {
      //   return this.$tm("basket.confirmation.default.actions.continue");
      // }

      return this.$tm("basket.confirmation.invalid.actions.complete");
    },

    storefrontUrl() {
      return import.meta.env.VITE_APP_UPMIND_STOREFRONT;
    },
  },

  methods: {
    doAction() {
      if (this.meta.isComplete) {
        this.processing = true;
        const invoiceId = this.invoice.id;
        this.transferSession().then(transfer => {
          if (invoiceId && transfer?.code) {
            window.location.href = utils.useUrl(
              "auth/transfer",
              {
                code: transfer.code,
                redirect: `/billing/invoices/${invoiceId}`,
              },
              { base: transfer.redirect_url, context: "" }
            );
          }
          //else {
          //this.$router.replace({ query: null });
          //his.processing = false;
          //}
        });
      }
    },
  },
});
</script>
.
