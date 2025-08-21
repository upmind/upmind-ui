<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        open
        modal
        skrim="light"
        :order-id="orderId"
        :success="success"
        :title="t(title)"
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
        <template #title>
          <SmartTitle :i18n-key="title" align="center" />
        </template>

        <template #actions>
          <Button
            color="primary"
            size="lg"
            :label="t(action)"
            :loading="processing"
            @click.stop="doAction"
            :icon="!meta.isAuthenticated ? 'arrow-left' : ''"
            :icon-append="meta.isAuthenticated ? 'arrow-right' : ''"
            pill
          />
        </template>
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useSession,
  useBasket,
  useRoutingEngine,
  utils,
  ROUTE,
  useBrand,
  useOrder
} from "@upmind-automation/headless";

// -- components
import {
  Interstitial,
  Button,
  Icon,
  Layout
} from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { storefrontUrl } = useBrand();
const { errors } = useBasket();
const { isResolved } = useRoutingEngine();

await isResolved(ROUTE.ORDER);

const { transferTo, meta } = useSession();
const orderId = route.params?.orderId?.toString();

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
    return "order.confirmation.invalid.title";
  } else if (orderMeta.value.hasError) {
    return "order.confirmation.error.title.text";
  } else if (success.value) {
    return "order.confirmation.success.title";
  }

  return "order.confirmation.failed.title";
});

const text = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("order.confirmation.invalid.text");
  } else if (orderMeta.value.hasError) {
    return t("order.confirmation.error.text");
  } else if (success.value) {
    return t("order.confirmation.success.text");
  }

  // Payment failed
  if (errors?.value?.message) {
    const message = errors.value.message;
    return `${message}${message.endsWith(".") ? "" : "."} ${t(
      "order.confirmation.failed.textRetry"
    )}`;
  }

  return `${t("order.confirmation.failed.text")} ${t("order.confirmation.failed.textRetry")}`;
});

const action = computed(() => {
  if (!meta.value.isAuthenticated) {
    return "order.confirmation.invalid.action";
  } else if (orderMeta.value.hasError) {
    return "order.confirmation.error.action";
  } else if (success.value) {
    return "order.confirmation.success.action";
  }

  return "order.confirmation.failed.action";
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
