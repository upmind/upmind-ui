<template>
  <uw-dialog
    size="xl"
    :model-value="modelValue"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.order.confirmation.root">
      <uw-avatar :avatar="avatar" :class="styles.order.confirmation.avatar" />

      <h3 :class="styles.order.confirmation.title">
        {{ title }}
      </h3>

      <p :class="styles.order.confirmation.text">{{ text }}</p>

      <footer :class="styles.order.confirmation.actions">
        <uw-button
          v-if="!meta.isAuthenticated && action"
          v-bind="action"
          variant="ghost"
          :loading="processing"
          :href="storefrontUrl"
        />
        <uw-button
          v-else-if="action"
          v-bind="action"
          variant="ghost"
          @click.prevent="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </uw-dialog>
</template>

<script>
// --- external
import { defineComponent, ref, toRefs } from "vue";

// --- internal
import { useSession, utils } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwDialog, UwAvatar, UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDialog);
useCustomElement(UwAvatar);
useCustomElement(UwButton);

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmOrderConfirmation",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    orderId: {
      type: String,
    },
    success: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { transfer, meta } = useSession();
    const styles = useStyles(["order.confirmation"], toRefs(props), config);

    // ---

    return {
      meta,
      transferSession: transfer,
      processing: ref(false),
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      if (!this.meta.isAuthenticated)
        return this.$tm("order.confirmation.invalid.title");

      if (this.success) return this.$t("order.confirmation.success.title");

      return this.$t("order.confirmation.failed.title");
    },

    text() {
      if (!this.meta.isAuthenticated)
        return this.$tm("order.confirmation.invalid.text");

      if (this.success) return this.$t("order.confirmation.success.text");

      return this.$t("order.confirmation.failed.text");
    },

    avatar() {
      if (!this.meta.isAuthenticated)
        return this.$tm("order.confirmation.invalid.avatar");

      if (this.success) {
        return this.$tm("order.confirmation.success.avatar");
      }

      return this.$tm("order.confirmation.failed.avatar");
    },

    action() {
      if (!this.meta.isAuthenticated)
        return this.$tm("order.confirmation.invalid.actions.continue");

      if (!this.orderId) return null;

      if (this.success)
        return this.$tm("order.confirmation.success.actions.continue");

      return this.$tm("order.confirmation.failed.actions.continue");
    },

    storefrontUrl() {
      return import.meta.env.VITE_APP_STOREFRONT;
    },
  },

  methods: {
    doAction() {
      if (!this.meta.isAuthenticated) {
        this.processing = false;
        return;
      }

      this.processing = true;
      this.transferSession()
        .then(transfer => {
          if (transfer?.code) {
            window.location.href = utils.useUrl(
              "auth/transfer",
              {
                code: transfer.code,
                redirect: `/billing/orders/${this.orderId}/overview`,
              },
              { base: transfer.redirect_url, context: "" }
            );
          }
        })
        .catch(() => {
          this.processing = false;
          this.$router.push("/");
        });
    },
  },
});
</script>
.
