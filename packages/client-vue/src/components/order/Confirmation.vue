<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'Dialog' : 'div'"
    :modelValue="isOpen"
    size="xl"
    persistent
    fit="cover"
    skrim="light"
  >
    <section :class="styles.order.confirmation.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.order.confirmation.title">{{ title }}</h3>

      <p :class="styles.order.confirmation.text">{{ text }}</p>

      <footer :class="styles.basket.processing.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent, ref, toRefs } from "vue";

// --- internal
import { useSession, utils } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { Avatar, Button, Dialog } from "@upmind/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmOrderConfirmation",
  components: {
    Avatar,
    Button,
    Dialog,
  },
  props: {
    modal: { type: Boolean },
    title: { type: String },
    text: { type: String },
    action: { type: Object, default: () => null },
    modelValue: { type: Boolean, default: true },
    avatar: {
      type: Object,
      default: () => ({
        size: "lg",
        shape: "circle",
        color: "primary",
        icon: "paying",
        fit: "contain",
      }),
    },
    orderId: { type: String },
    success: { type: Boolean },
  },
  setup(props) {
    const { transfer, meta } = useSession();
    const styles = useStyles(["order.confirmation"], toRefs(props), config);

    // ---

    return {
      meta,
      transferSession: transfer,
      processing: ref(false),
      styles,
    };
  },
  computed: {
    isOpen() {
      const value = this.meta.isProcessing;
      return value || this.modelValue;
    },
    hasAction() {
      return !isEmpty(this.action);
    },
  },
  methods: {
    doAction() {
      if (isFunction(this.action?.handler)) {
        this.processing = true;
        this.action.handler().finally(() => {
          this.processing = false;
        });
      }
    },
    doTransfer() {
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
