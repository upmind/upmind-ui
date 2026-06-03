<template>
  <component :is="templateVariant">
    <template #order-summary>
      <Hero
        v-show="!meta.isProcessing"
        :title="title"
        :description="text"
        :loading="meta.isLoading"
        :badge="badge"
      >
        <template #append>
          <div v-if="action && !meta.isComplete">
            <Button
              variant="subtle"
              size="lg"
              :label="t(action)"
              :loading="actionProcessing"
              @click.stop="doAction"
              :icon="!meta.isAuthenticated ? 'arrow-left' : ''"
              :icon-append="meta.isAuthenticated ? 'arrow-right' : ''"
            />
          </div>
        </template>
      </Hero>
    </template>

    <template #order-payment-details v-if="meta.isAvailable">
      <Alert
        v-if="primaryAlert"
        v-show="!meta.isProcessing"
        v-bind="primaryAlert"
        variant="minimal"
        @click="primaryAlert?.onClick"
      />
      <PaymentDetails
        v-if="!meta.isLocked"
        v-show="!meta.isProcessing"
        :label="t('action.pay_now')"
        :processing="meta.isProcessing"
        @resolve="pay"
      >
        <template #prepend>
          <Alert
            v-if="secondaryAlert"
            v-bind="secondaryAlert"
            variant="minimal"
            @click="secondaryAlert?.onClick"
          />
        </template>
      </PaymentDetails>
    </template>

    <template v-if="!meta.isUnavailable" #order-details>
      <Section
        v-show="!meta.isProcessing"
        id="order-details"
        :label="t('text.order_summary')"
        icon="shopping-bag-02"
      >
        <DescriptionList
          v-if="!meta.isLoading && orderItems.length"
          :items="orderItems"
        >
          <div
            v-if="orderData?.summary?.total"
            :class="detailsStyles.details.total.root"
          >
            <dt :class="detailsStyles.details.total.label">
              {{ t("text.order_total") }}
            </dt>
            <dd :class="detailsStyles.details.total.value">
              {{ orderData.summary.total }}
            </dd>
          </div>
        </DescriptionList>

        <!-- Skeleton loader -->
        <template v-else>
          <div :class="detailsStyles.details.skeleton.root">
            <div :class="detailsStyles.details.skeleton.row">
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="sm"
              />
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="lg"
              />
            </div>
            <div :class="detailsStyles.details.skeleton.row">
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="md"
              />
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="xl"
              />
            </div>
            <div :class="detailsStyles.details.skeleton.row">
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="lg"
              />
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="md"
              />
            </div>
            <div :class="detailsStyles.details.skeleton.totalRow">
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="2xl"
              />
              <Skeleton
                :class="detailsStyles.details.skeleton.item"
                data-width="3xl"
              />
            </div>
          </div>
        </template>
      </Section>
    </template>

    <template v-if="!meta.isUnavailable" #order-products>
      <OrderProducts v-show="!meta.isProcessing">
        <template #append>
          <Button
            v-if="action && meta.isComplete"
            size="lg"
            :label="t(action)"
            :loading="actionProcessing"
            @click.stop="doAction"
            :icon="!meta.isAuthenticated ? 'arrow-left' : ''"
            :icon-append="meta.isAuthenticated ? 'arrow-right' : ''"
          />
        </template>
      </OrderProducts>
    </template>

    <!-- Guest → full-account upgrade after checkout. Prompt first, then the
         shared Auth register form (which the client machine drives for a guest
         client). Hidden once the upgrade promotes them to a full client. -->
    <template
      v-if="meta.isComplete && sessionMeta.isGuestClient"
      #guest-registration
    >
      <Section
        v-show="!meta.isProcessing"
        id="guest-registration"
        :label="t('auth.guest_register_title')"
        icon="user-plus-01"
      >
        <Alert
          v-if="!showGuestUpgrade"
          :title="t('auth.guest_register_title')"
          :description="t('auth.guest_register_description')"
          icon="user-plus-01"
          color="neutral"
          :action="{ label: t('action.register') }"
          @click="showGuestUpgrade = true"
        />
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

  <PaymentProcessing v-if="meta.isProcessing" />
</template>

<script lang="ts" setup>
// --- external
import {
  computed,
  defineAsyncComponent,
  onUnmounted,
  provide,
  ref,
  watch
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useOrder,
  useUrl,
  QUERY_PARAMS,
  UIContext
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";

// -- components
import Auth from "../session/components/Auth.vue";
import OrderProducts from "./components/OrderProducts.vue";
import PaymentDetails from "../payment/components/PaymentDetails.vue";
import PaymentProcessing from "../payment/components/PaymentProcessing.vue";
import Hero from "../../components/hero/Hero.vue";
import Section from "../../components/section/Section.vue";
import {
  useThemes,
  Alert,
  Button,
  DescriptionList,
  Skeleton,
  useStyles,
  type AlertProps,
  type DescriptionItem,
  type BadgeProps
} from "@upmind-automation/upmind-ui";

// --- internal
import config from "./order.config";
import { useAnnouncement } from "../../components/announcement/useAnnouncement";

// --- utils
import { capitalize, first, get } from "lodash-es";

// --- types
import { ORDER_TEMPLATE } from "./types";
import type { OrderProps } from "./types";

//  --- templates
const supportedTemplates = {
  [ORDER_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/OrderFull.template.vue")
  ),
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/OrderLTR.template.vue")
  ),
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/OrderRTL.template.vue")
  ),
  [ORDER_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/OrderEnclosed.template.vue")
  )
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

const { transferTo, meta: sessionMeta } = useSession();
const showGuestUpgrade = ref(false);
const {
  cancelChallenge,
  errors,
  invoice: orderData,
  isReady,
  meta,
  pay,
  paymentDetail,
  refresh,
  renderChallenge,
  retry
} = useOrder(orderId);

await isReady();

provide("usePaymentDetail", paymentDetail);
provide("usePaymentChallenge", { renderChallenge, cancelChallenge, meta });
provide("orderInvoice", orderData);

const { show: showAnnouncement, dismiss: dismissAnnouncement } =
  useAnnouncement();

// -----------------------------------------------------------------------------

const configMeta = useConfig({
  context: UIContext.CONFIRMATION,
  provide: true
});

const template = computed(
  () =>
    props.template ||
    configMeta.ui.template.value ||
    ORDER_TEMPLATE.TWO_COLUMN_RTL
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

const badge = computed(() => {
  if (meta.value.isComplete)
    return {
      label: t("text.confirmed"),
      icon: "check-circle",
      color: "success" as BadgeProps["color"]
    };

  return {
    label: t("text.pending"),
    icon: "clock"
  };
});

const primaryAlert = computed<
  (AlertProps & { onClick?: () => void }) | undefined
>(() => {
  if (meta.value.isLocked)
    return {
      title: t("invoice.order_locked"),
      description: t("invoice.order_locked_msg"),
      icon: "lock-03",
      color: "neutral"
    };
  if (meta.value.hasError)
    return {
      title: t("invoice.payment_retry"),
      description: errors.value?.message || t("invoice.payment_retry_msg"),
      icon: "alert-octagon",
      color: "danger",
      action: {
        label: t("invoice.payment_retry_action")
      },
      onClick: retry
    };
  if (meta.value.isPaymentDue)
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
      color: "warning"
    };
});

const secondaryAlert = computed<
  (AlertProps & { onClick?: () => void }) | undefined
>(() => {
  if (meta.value.isPending)
    return {
      title: t("invoice.order_pending"),
      description: t("invoice.order_pending_msg"),
      icon: "clock",
      color: "warning",
      action: {
        label: t("action.refresh"),
        disabled: meta.value.isLoading
      },
      onClick: refresh
    };
  if (meta.value.isPartial)
    return {
      title: t("invoice.payment_partial"),
      description: t("invoice.payment_partial_msg", {
        remaining_amount: orderData.value?.summary.unpaidAmountFormatted
      }),
      icon: "alert-octagon",
      color: "warning"
    };
});

const title = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("text.session_expired");
  }
  if (meta.value.isUnavailable) {
    return t("invoice.order_not_found");
  }
  if (meta.value.isComplete || meta.value.isPartial) {
    return t("invoice.order_complete");
  }
  return t("invoice.order_placed");
});

const text = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("text.session_expired_return_store_msg");
  }
  if (meta.value.isUnavailable) {
    return t("invoice.order_not_found_msg");
  }
  if (meta.value.isComplete) {
    return t("invoice.order_complete_msg");
  }
  if (meta.value.isFree) {
    return t("invoice.order_free_msg");
  }
  if (meta.value.isPartial) {
    return t("invoice.order_partial_payment_msg", {
      paid_amount: orderData.value?.summary.paidAmountFormatted
    });
  }
  return t("invoice.order_placed_msg");
});

const detailsStyles = useStyles(
  ["details.total", "details.skeleton"],
  {},
  config
);

const orderItems = computed((): DescriptionItem[] => {
  if (!orderData.value) return [];

  const items: DescriptionItem[] = [];

  if (orderData.value.number) {
    items.push({
      term: t("text.order_number"),
      description: orderData.value.number
    });
  }

  if (orderData.value.dateCreated?.date) {
    items.push({
      term: t("text.purchase_date"),
      description: orderData.value.dateCreated.date
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
      })
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
  if (!meta.value.isAuthenticated) {
    return "action.return_to_shop";
  } else if (meta.value.isUnavailable) {
    return "action.go_to_my_orders";
  }
  return "action.go_to_my_account";
});

function doAction() {
  if (!meta.value.isAuthenticated) {
    const route = props.storefrontRoute;

    if (route?.href) {
      window.location.href = route.href;
    } else {
      router.push(route?.to ?? "/");
    }

    actionProcessing.value = false;
    return;
  }

  actionProcessing.value = true;

  transferTo()
    .then(transfer => {
      if (transfer?.code) {
        window.location.href = useUrl(
          transferAuth,
          {
            code: transfer.code,
            redirect: meta.value.isUnavailable
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
  () => [meta.value.hasError, meta.value.isComplete, meta.value.isPartial],
  ([hasError, isComplete, isPartial]) => {
    if (hasError) {
      showAnnouncement({
        text: t("invoice.payment_failed_banner"),
        type: "danger"
      });
    } else if (
      (isComplete || isPartial) &&
      !meta.value.isFree &&
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
  () => meta.value.isProcessing,
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
