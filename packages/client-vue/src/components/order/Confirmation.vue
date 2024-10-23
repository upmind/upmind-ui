<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    fit="cover"
    no-close
    no-header
    persistent
  >
    <template #header>
      <div />
    </template>

    <section :class="styles.order.confirmation.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.order.confirmation.title">{{ title }}</h3>

      <p :class="styles.order.confirmation.text">{{ text }}</p>

      <footer :class="styles.order.confirmation.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
          :label="action?.label"
        >
          <template #prepend>
            <Icon v-if="action?.prependIcon" :icon="action.prependIcon" />
          </template>
        </Button>
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

// --- internal
import { useSession, utils } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Icon, Avatar, Dialog, Button } from "@upmind/upwind";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { OrderConfirmationProps } from "./types";
// -----------------------------------------------------------------------------
const router = useRouter();

const props = withDefaults(defineProps<OrderConfirmationProps>(), {
  modal: false,
  skrim: "primary",
  size: "app",
  avatar: () => ({
    size: "lg",
    shape: "circle",
    color: "primary",
    icon: "paying",
    fit: "contain",
  }),
});

const { transfer: transferSession, meta } = useSession();

const styles = useStyles(["order.confirmation"], meta, config);

const processing = ref(false);
const isOpen = computed(() => meta.value.isProcessing || props.open);
const hasAction = computed(() => {
  return !isEmpty(props.action);
});

function doAction() {
  if (!meta.value.isAuthenticated) {
    processing.value = false;
    return;
  }

  processing.value = true;
  transferSession()
    .then(transfer => {
      if (hasAction.value && props.action?.href) {
        window.location.href = props.action.href;
      } else if (transfer?.code) {
        window.location.href = utils
          .useUrl(
            "auth/transfer",
            {
              code: transfer.code,
              redirect: `/billing/orders/${props.orderId}/overview`,
            },
            { base: transfer.redirect_url, context: "" }
          )
          .toString();
      }
    })
    .catch(() => {
      processing.value = false;
      router.push("/");
    });
}
</script>
