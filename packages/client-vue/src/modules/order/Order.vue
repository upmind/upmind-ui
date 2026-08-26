<template>
  <component :is="templateVariant">
    <template #order-summary>
      <Hero
        v-show="!orderMeta.isProcessing"
        :title="title"
        :description="text"
        :loading="orderMeta.isLoading"
        :badge="badge"
        :dataAttrs="{ 'data-test-key': 'order-confirmation-heading' }"
        size="xl"
      >
        <template #append>
          <div v-if="action && !orderMeta.isComplete">
            <Button
              variant="subtle"
              size="lg"
              :loading="actionProcessing"
              @click.stop="doAction"
            >
              <Icon v-if="!orderMeta.isAuthenticated" icon="arrow-left" />
              {{ t(action) }}
              <Icon v-if="orderMeta.isAuthenticated" icon="arrow-right" />
            </Button>
          </div>
        </template>
      </Hero>
    </template>

    <template #order-payment-details v-if="orderMeta.isAvailable">
      <Alert
        v-if="primaryAlert"
        v-show="!orderMeta.isProcessing"
        v-bind="omit(primaryAlert, ['icon'])"
        appearance="outline"
        @click="primaryAlert?.onClick"
      >
        <template #icon><Icon :icon="primaryAlert.icon" /></template>
      </Alert>
      <PaymentDetails
        v-if="!orderMeta.isLocked"
        v-show="!orderMeta.isProcessing"
        :label="t('action.pay_now')"
        :processing="orderMeta.isProcessing"
        @resolve="pay"
      >
        <template #prepend>
          <Alert
            v-if="secondaryAlert"
            v-bind="omit(secondaryAlert, ['icon'])"
            appearance="outline"
            @click="secondaryAlert?.onClick"
          >
            <template #icon><Icon :icon="secondaryAlert.icon" /></template>
          </Alert>
        </template>
      </PaymentDetails>
    </template>

    <template v-if="!orderMeta.isUnavailable" #order-details>
      <Section
        v-show="!orderMeta.isProcessing"
        id="order-details"
        :label="t('text.order_summary')"
        icon="shopping-bag-02"
      >
        <DescriptionListRoot
          v-if="!orderMeta.isLoading && orderItems.length"
          align="between"
          class="gap-y-2"
          data-test-key="description-list"
        >
          <DescriptionItem
            v-for="(item, index) in orderItems"
            :key="index"
            :term="item.term"
            v-bind="item.dataAttrs"
          >
            {{ item.description }}
          </DescriptionItem>
          <div
            v-if="orderData?.summary?.total"
            class="col-span-2"
            :class="detailsTotalRootVariants()"
          >
            <dt :class="detailsTotalLabelVariants()">
              {{ t("text.order_total") }}
            </dt>
            <dd :class="detailsTotalValueVariants()">
              {{ orderData.summary.total }}
            </dd>
          </div>
        </DescriptionListRoot>

        <!-- Skeleton loader -->
        <template v-else>
          <div :class="detailsSkeletonRootVariants()">
            <div :class="detailsSkeletonRowVariants()">
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="sm"
              />
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="lg"
              />
            </div>
            <div :class="detailsSkeletonRowVariants()">
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="md"
              />
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="xl"
              />
            </div>
            <div :class="detailsSkeletonRowVariants()">
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="lg"
              />
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="md"
              />
            </div>
            <div :class="detailsSkeletonTotalRowVariants()">
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="2xl"
              />
              <Skeleton
                :class="detailsSkeletonItemVariants()"
                data-width="3xl"
              />
            </div>
          </div>
        </template>
      </Section>
    </template>

    <template v-if="!orderMeta.isUnavailable" #order-products>
      <OrderProducts v-show="!orderMeta.isProcessing">
        <template #append>
          <Button
            v-if="action && orderMeta.isComplete"
            size="lg"
            :loading="actionProcessing"
            @click.stop="doAction"
          >
            <Icon v-if="!orderMeta.isAuthenticated" icon="arrow-left" />
            {{ t(action) }}
            <Icon v-if="orderMeta.isAuthenticated" icon="arrow-right" />
          </Button>
        </template>
      </OrderProducts>
    </template>

    <!-- Guest → full-account upgrade after checkout. Prompt first, then the
         shared Auth register form (which the client machine drives for a guest
         client). Hidden once the upgrade promotes them to a full client.
         Suppressed when a registerRoute is provided — the action CTA sends the
         guest to a dedicated register page instead. -->
    <template v-if="meta.showInlineGuestRegistration" #guest-registration>
      <Section
        v-show="!orderMeta.isProcessing"
        id="guest-registration"
        :label="t('auth.guest_register_title')"
        icon="user-plus-01"
      >
        <Alert
          v-if="!showGuestUpgrade"
          :title="t('auth.guest_register_title')"
          :description="t('auth.guest_register_description')"
          variant="neutral"
          :action="{ label: t('action.register') }"
          @click="showGuestUpgrade = true"
        >
          <template #icon><Icon icon="user-plus-01" /></template>
        </Alert>
        <Auth
          v-else
          no-tabs
          no-header
          model-value="register"
          @resolve="showGuestUpgrade = false"
        />
      </Section>
    </template>
  </component>

  <PaymentProcessing v-if="orderMeta.isProcessing" />
</template>

<script lang="ts" setup>
import { Button } from "@upmind/ui";
import { DescriptionListRoot, DescriptionItem, Skeleton } from "@upmind/ui";
import { Alert, type AlertProps } from "@upmind/ui";
import { computed, onUnmounted, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  useAccount,
  useTransfer,
  useOrder,
  useUrl,
  validateTemplate,
  QUERY_PARAMS,
  ScopeActorTypes,
  UIContext,
  type Badge
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { useAnnouncement } from "../../components/announcement/useAnnouncement";
import Hero from "../../components/hero/Hero.vue";
import { Icon } from "../../components/icon";
import Section from "../../components/section/Section.vue";
import PaymentDetails from "../payment/components/PaymentDetails.vue";
import PaymentProcessing from "../payment/components/PaymentProcessing.vue";
import Auth from "../session/components/Auth.vue";
import { useThemes } from "../theming";
import OrderProducts from "./components/OrderProducts.vue";
import OrderEnclosedTemplate from "./templates/OrderEnclosed.template.vue";
import OrderFullTemplate from "./templates/OrderFull.template.vue";
import OrderInsetTemplate from "./templates/OrderInset.template.vue";
import OrderLTRTemplate from "./templates/OrderLTR.template.vue";
import OrderRTLTemplate from "./templates/OrderRTL.template.vue";
import { ORDER_TEMPLATE } from "./types";
import {
  detailsTotalRootVariants,
  detailsTotalLabelVariants,
  detailsTotalValueVariants,
  detailsSkeletonRootVariants,
  detailsSkeletonRowVariants,
  detailsSkeletonTotalRowVariants,
  detailsSkeletonItemVariants
} from "./variants";
import { capitalize, first, get, omit } from "lodash-es";
import type { OrderProps } from "./types";

interface OrderItem {
  term?: string;
  description: string;
  dataAttrs?: Record<string, string>;
}

//  --- templates

const supportedTemplates = {
  [ORDER_TEMPLATE.FULL]: OrderFullTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: OrderLTRTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: OrderRTLTemplate,
  [ORDER_TEMPLATE.ENCLOSED]: OrderEnclosedTemplate,
  [ORDER_TEMPLATE.INSET]: OrderInsetTemplate
};

const props = defineProps<OrderProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orderId = route.params?.[QUERY_PARAMS.ORDER_ID]?.toString();

const { set } = useThemes();

const { ui } = useConfig({
  context: UIContext.CONFIRMATION
});

set(ui.theme.value);

// -----------------------------------------------------------------------------

const { transferTo } = useTransfer();
const { isGuest: isGuestClient } = useAccount()
  .as(ScopeActorTypes.CLIENT)
  .useMeta();
const showGuestUpgrade = ref(false);
const {
  cancelChallenge,
  errors,
  invoice: orderData,
  isReady,
  meta: orderMeta,
  pay,
  paymentDetail,
  refresh,
  renderChallenge,
  retry
} = useOrder(orderId);

await isReady();

provide("usePaymentDetail", paymentDetail);
provide("usePaymentChallenge", {
  renderChallenge,
  cancelChallenge,
  meta: orderMeta
});
provide("orderInvoice", orderData);

const { show: showAnnouncement, dismiss: dismissAnnouncement } =
  useAnnouncement();

// Component-level guest-registration state, derived from the order's headless
// meta plus session + props. isGuestRegister → the action CTA routes to a
// dedicated register page; showInlineGuestRegistration → render the inline Auth
// form instead (when no register route is provided).
const meta = computed(() => ({
  isGuestRegister: isGuestClient.value && !!props.registerRoute,
  showInlineGuestRegistration:
    orderMeta.value.isComplete && isGuestClient.value && !props.registerRoute
}));

// -----------------------------------------------------------------------------

const configMeta = useConfig({
  context: UIContext.CONFIRMATION,
  provide: true
});

const template = computed(() =>
  validateTemplate(
    props.template || configMeta.ui.template.value,
    ORDER_TEMPLATE,
    ORDER_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

const badge = computed<Badge>(() => {
  if (orderMeta.value.isComplete)
    return {
      label: t("text.confirmed"),
      icon: "check-circle",
      variant: "success",
      appearance: "outline"
    };

  return {
    label: t("text.pending"),
    icon: "clock",
    variant: "neutral",
    appearance: "outline"
  };
});

// `icon` rides alongside the DS Alert props — it renders through the #icon slot
// rather than a prop, so the template omits it when binding.
const primaryAlert = computed<
  (AlertProps & { icon: string; onClick?: () => void }) | undefined
>(() => {
  if (orderMeta.value.isLocked)
    return {
      title: t("invoice.order_locked"),
      description: t("invoice.order_locked_msg"),
      icon: "lock-03",
      variant: "neutral",
      dataAttrs: {
        "data-test-key": "confirmation-payment-alert",
        "data-test-value": "locked"
      }
    };
  if (orderMeta.value.hasError)
    return {
      title: t("invoice.payment_retry"),
      description: errors.value?.message || t("invoice.payment_retry_msg"),
      icon: "alert-octagon",
      variant: "danger",
      action: {
        label: t("invoice.payment_retry_action")
      },
      onClick: retry,
      dataAttrs: {
        "data-test-key": "confirmation-payment-alert",
        "data-test-value": "failed"
      }
    };
  if (orderMeta.value.isPaymentDue)
    return {
      title: t("invoice.payment_due"),
      description: orderData.value?.dateDue?.date
        ? t("invoice.payment_due_msg", {
            amount: orderData.value?.summary.unpaidAmountFormatted,
            due_date: orderData.value?.dateDue?.date
          })
        : t("invoice.payment_required_msg", {
            amount: orderData.value?.summary.unpaidAmountFormatted
          }),
      icon: "calendar",
      variant: "warning",
      dataAttrs: {
        "data-test-key": "confirmation-payment-alert",
        "data-test-value": "due"
      }
    };

  return undefined;
});

const secondaryAlert = computed<
  (AlertProps & { icon: string; onClick?: () => void }) | undefined
>(() => {
  if (orderMeta.value.isPending)
    return {
      title: t("invoice.order_pending"),
      description: t("invoice.order_pending_msg"),
      icon: "clock",
      variant: "warning",
      action: {
        label: t("action.refresh"),
        disabled: orderMeta.value.isLoading
      },
      onClick: refresh,
      dataAttrs: {
        "data-test-key": "confirmation-payment-secondary-alert",
        "data-test-value": "pending"
      }
    };
  if (orderMeta.value.isPartial)
    return {
      title: t("invoice.payment_partial"),
      description: t("invoice.payment_partial_msg", {
        remaining_amount: orderData.value?.summary.unpaidAmountFormatted
      }),
      icon: "alert-octagon",
      variant: "warning",
      dataAttrs: {
        "data-test-key": "confirmation-payment-secondary-alert",
        "data-test-value": "outstanding"
      }
    };

  return undefined;
});

const title = computed(() => {
  if (!orderMeta.value.isAuthenticated) {
    return t("text.session_expired");
  }
  if (orderMeta.value.isUnavailable) {
    return t("invoice.order_not_found");
  }
  if (orderMeta.value.isComplete || orderMeta.value.isPartial) {
    return t("invoice.order_complete");
  }
  return t("invoice.order_placed");
});

const text = computed(() => {
  if (!orderMeta.value.isAuthenticated) {
    return t("text.session_expired_return_store_msg");
  }
  if (orderMeta.value.isUnavailable) {
    return t("invoice.order_not_found_msg");
  }
  if (orderMeta.value.isComplete) {
    return t("invoice.order_complete_msg");
  }
  if (orderMeta.value.isFree) {
    return t("invoice.order_free_msg");
  }
  if (orderMeta.value.isPartial) {
    return t("invoice.order_partial_payment_msg", {
      paid_amount: orderData.value?.summary.paidAmountFormatted
    });
  }
  return t("invoice.order_placed_msg");
});

const orderItems = computed((): OrderItem[] => {
  if (!orderData.value) return [];

  const items: OrderItem[] = [];

  if (orderData.value.number) {
    items.push({
      term: t("text.order_number"),
      description: orderData.value.number,
      dataAttrs: {
        "data-test-key": "confirmation-invoice-number",
        "data-test-value": orderData.value.number
      }
    });
  }

  if (orderData.value.dateCreated?.date) {
    items.push({
      term: t("text.purchase_date"),
      description: orderData.value.dateCreated.date,
      dataAttrs: {
        "data-test-key": "confirmation-order-date",
        "data-test-value": orderData.value.dateCreated.date
      }
    });
  }

  // Most recent payment is first
  const lastPayment = first(orderData.value.payments);
  if (lastPayment?.cardType && lastPayment?.cardLast4) {
    items.push({
      term: t("text.payment_method"),
      description: t("text.card_ending", {
        card_type: capitalize(lastPayment.cardType),
        last4: lastPayment.cardLast4
      }),
      dataAttrs: {
        "data-test-key": "confirmation-order-payment-method",
        "data-test-value": lastPayment.cardLast4
      }
    });
  }

  return items;
});

// -----------------------------------------------------------------------------

const transferBase =
  import.meta.env.VITE_APP_ORDER_TRANSFER_AUTH_BASE ?? undefined;

const transferAuth =
  import.meta.env.VITE_APP_ORDER_TRANSFER_AUTH_PATH ?? "auth/transfer";

const transferErrorRedirect =
  import.meta.env.VITE_APP_ORDER_TRANSFER_ERROR_REDIRECT ?? "/billing/orders";

const transferRedirect = (
  import.meta.env.VITE_APP_ORDER_TRANSFER_REDIRECT ||
  "/billing/orders/{{orderId}}/overview"
).replace(/{{([^{}]+)}}/g, (_keyExpr: string, key: string) => {
  if (key == "orderId") return orderId;
  return;
});

const actionProcessing = ref(false);

const action = computed(() => {
  if (!orderMeta.value.isAuthenticated) {
    return "action.return_to_shop";
  } else if (orderMeta.value.isUnavailable) {
    return "action.go_to_my_orders";
  } else if (meta.value.isGuestRegister) {
    return "action.create_account";
  }
  return "action.go_to_my_account";
});

// Guest → register/upgrade page, tagging the current order as the returnUrl so
// the funnel brings the upgraded client straight back here.
function createAccount() {
  router.push({
    name: props.registerRoute?.name,
    query: { [QUERY_PARAMS.RETURN_URL]: route.fullPath }
  });
}

function doAction() {
  if (!orderMeta.value.isAuthenticated) {
    const route = props.storefrontRoute;

    if (route?.href) {
      window.location.href = route.href;
    } else {
      router.push(route?.to ?? "/");
    }
  } else if (meta.value.isGuestRegister) {
    createAccount();
  } else {
    actionProcessing.value = true;
    doTransfer();
  }
}

function doTransfer() {
  transferTo()
    .then(transfer => {
      if (transfer?.code) {
        window.location.href = useUrl(
          transferAuth,
          {
            code: transfer.code,
            redirect: orderMeta.value.isUnavailable
              ? transferErrorRedirect
              : transferRedirect
          },
          { base: transferBase ?? transfer.redirect_url, context: "" }
        ).toString();
      }
    })
    .catch(() => {
      actionProcessing.value = false;
      router.push("/");
    });
}

// -----------------------------------------------------------------------------

watch(
  () => [
    orderMeta.value.hasError,
    orderMeta.value.isComplete,
    orderMeta.value.isPartial
  ],
  ([hasError, isComplete, isPartial]) => {
    if (hasError) {
      showAnnouncement({
        text: t("invoice.payment_failed_banner"),
        type: "danger"
      });
    } else if (
      (isComplete || isPartial) &&
      !orderMeta.value.isFree &&
      orderData.value?.datePaid?.date
    ) {
      showAnnouncement({
        text: t("invoice.payment_success_banner", {
          date: orderData.value.datePaid.date
        }),
        type: "success"
      });
    } else {
      dismissAnnouncement();
    }
  },
  { immediate: true }
);

watch(
  () => orderMeta.value.isProcessing,
  processing => {
    if (processing) {
      window.scrollTo(0, 0);
    }
  }
);

onUnmounted(() => {
  dismissAnnouncement();
});
</script>
