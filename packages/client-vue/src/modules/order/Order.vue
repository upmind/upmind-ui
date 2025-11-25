<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      open
      modal
      :order-id="orderId"
      :success="success"
      :title="title"
      :text="text"
      size="2xl"
      shape="circle"
      color="primary"
      icon="paying"
      fit="contain"
      :animated-icon="{
        icon: icon,
        trigger: 'loop',
        primaryColor: 'base-foreground',
        secondaryColor: 'tertiary',
        size: '4xl'
      }"
    >
      <template #actions>
        <Button
          color="primary"
          size="lg"
          :label="t(action)"
          :loading="processing"
          @click.stop="doAction"
          :icon="!meta.isAuthenticated ? 'arrow-left' : ''"
          :icon-append="meta.isAuthenticated ? 'arrow-right' : ''"
        />
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useBasket,
  useRoutingEngine,
  utils,
  ROUTE,
  useBrand,
  useOrder,
  QUERY_PARAMS
} from "@upmind-automation/headless";

// -- components
import { Interstitial, Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { storefrontUrl } = useBrand();
const { errors } = useBasket();
const { isResolved } = useRoutingEngine();

await isResolved(ROUTE.ORDER);
const orderId = route.params?.[QUERY_PARAMS.ORDER_ID]?.toString();

const { transferTo, meta } = useSession();
const { meta: orderMeta, isReady: isOrderReady } = useOrder(orderId);
await isOrderReady();

const success = computed(
  () => route.query.payment_success === "true" || orderMeta.value.isPaid
);

const transferBase =
  import.meta.env.VITE_APP_ORDER_TRANSFER_AUTH_BASE ?? undefined;

const transferAuth =
  import.meta.env.VITE_APP_ORDER_TRANSFER_AUTH_PATH ?? "auth/transfer";

const transferRedirect = (
  import.meta.env.VITE_APP_ORDER_TRANSFER_REDIRECT ||
  "/billing/orders/{{orderId}}/overview"
).replace(/{{([^{}]+)}}/g, (_keyExpr: string, key: string) => {
  if (key == "orderId") return orderId;
  return;
});

const title = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("text.session_expired_md");
  } else if (orderMeta.value.hasError) {
    return t("invoice.order_not_found_md");
  } else if (success.value) {
    return t("invoice.order_complete_md");
  }

  return t("invoice.order_payment_failed_md");
});

const text = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("text.session_expired_return_store_msg");
  } else if (orderMeta.value.hasError) {
    return t("invoice.order_not_found_msg");
  } else if (success.value) {
    return t("invoice.order_complete_msg");
  }

  // Payment failed
  if (errors?.value?.message) {
    const message = errors.value.message;
    return `${message}${message.endsWith(".") ? "" : "."} ${t(
      "invoice.order_payment_retry_msg"
    )}`;
  }

  return `${t("invoice.order_payment_failed_msg")} ${t("invoice.order_payment_retry_msg")}`;
});

const action = computed(() => {
  if (!meta.value.isAuthenticated) {
    return "action.return_to_shop";
  } else if (orderMeta.value.hasError) {
    return "action.go_to_my_account";
  } else if (success.value) {
    return "action.go_to_my_account";
  }
  return "action.go_to_invoice";
});

const icon = computed(() => {
  if (!meta.value.isAuthenticated) {
    return "2fa";
  } else if (success.value) {
    return "confetti";
  }

  return "error";
});

// -----------------------------------------------------------------------------

const processing = ref(false);

function doAction() {
  if (!meta.value.isAuthenticated) {
    window.location.href = storefrontUrl.value;
    processing.value = false;
    return;
  }

  processing.value = true;

  transferTo()
    .then(transfer => {
      if (transfer?.code) {
        window.location.href = utils
          .useUrl(
            transferAuth,
            {
              code: transfer.code,
              redirect: transferRedirect
            },
            { base: transferBase ?? transfer.redirect_url, context: "" }
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
