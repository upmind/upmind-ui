<template>
  <upw-dialog
    size="xl"
    :model-value="!!orderId"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.order.confirmation.root">
      <upw-avatar :avatar="avatar" :class="styles.order.confirmation.avatar" />

      <h3 :class="styles.order.confirmation.title">
        {{ title }}
      </h3>

      <p :class="styles.order.confirmation.text">{{ text }}</p>

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
import { defineComponent, ref, toRefs } from "vue";

// --- internal
import { useSession, utils } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwDialog, UpwAvatar, UpwButton } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmOrderConfirmation",
  components: {
    UpwDialog,
    UpwAvatar,
    UpwButton,
  },
  props: {
    orderId: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { transfer } = useSession();
    const styles = useStyles(["order.confirmation"], toRefs(props), config);

    // ---

    return {
      transferSession: transfer,
      processing: ref(false),
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {
    title() {
      if (this.success) {
        return this.$t("order.confirmation.success.title");
      }

      return this.$t("order.confirmation.failed.title");
    },

    text() {
      if (this.success) {
        return this.$t("order.confirmation.success.text");
      }

      return this.$t("order.confirmation.failed.text");
    },

    avatar() {
      if (this.success) {
        return this.$tm("order.confirmation.success.avatar");
      }

      return this.$tm("order.confirmation.failed.avatar");
    },

    action() {
      if (this.success) {
        return this.$tm("order.confirmation.success.actions.continue");
      }

      return this.$tm("order.confirmation.failed.actions.continue");
    },
  },

  methods: {
    doAction() {
      this.processing = true;
      this.transferSession().then(transfer => {
        if (transfer?.code) {
          window.location.href = utils.useUrl(
            "auth/transfer",
            {
              code: transfer.code,
              redirect: `/order/complete/?oid=${this.orderId}`,
            },
            { base: transfer.redirect_url, context: "" }
          );
        }
      });
    },
  },
});
</script>
.
