<template>
  <OptionTileGroup v-model="selectedPaymentMethod" mode="single" required>
    <OptionTile value="selected-gateway" :label="gateway?.name">
      <template v-if="!props.singleGateway" #trailing>
        <Link size="sm" color="muted" @click="clearGateway">
          {{ t("action.change") }}
        </Link>
      </template>
    </OptionTile>
  </OptionTileGroup>

  <div ref="form" :class="gatewayFormVariants({ hasErrors: meta.hasErrors })">
    <!-- Instructions -->
    <Markdown
      v-if="instructions"
      class="m-0 w-full p-0"
      :model-value="instructions"
    />

    <!-- gateway Render Content (* IF Provided) -->
    <div
      :id="`${gateway.id}_render_container`"
      ref="container"
      class="w-full empty:hidden"
      key="render"
    ></div>

    <!-- gateway Form (* IF Provided) -->
    <Form
      v-if="schema && uischema && !meta.isRenderless"
      key="form"
      :additional-errors="validationErrors"
      :model-value="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      @reject="clear"
      @resolve="update"
      @update:modelValue="input"
      no-actions
    />

    <!-- Errors and Feedback -->
    <Alert
      v-if="error || (errors && meta.hasErrors)"
      variant="danger"
      appearance="outline"
      :title="t('text.payment_failed')"
      :dataAttrs="{ 'data-test-key': 'order-payment-failed-message' }"
    >
      <template #icon><Icon icon="alert-triangle" /></template>
      <ol class="mt-2 list-none text-left text-sm">
        <li class="my-0 py-0">
          {{ error ?? errors }}
        </li>
      </ol>
    </Alert>

    <!-- Unsupported Message -->
    <Alert
      v-if="meta.isNotSupported || meta.isUnavailable"
      appearance="outline"
      :title="t('error.payment_gateway_not_supported_title')"
      :description="errors ?? t('error.payment_gateway_not_supported_msg')"
      class="text-danger!"
      :dataAttrs="{ 'data-test-key': 'payment-gateway-unavailable-message' }"
    >
      <template #icon><Icon icon="info-circle" /></template>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
import {
  inject,
  onMounted,
  onUnmounted,
  useTemplateRef,
  computed,
  ref,
  watch
} from "vue";
import { useI18n } from "vue-i18n";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  usePaymentGateway
} from "@upmind-automation/headless";
import { Markdown, OptionTileGroup, OptionTile, Link } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import Form from "../../../components/form/Form.vue";
import { Icon } from "../../../components/icon";
import { gatewayFormVariants } from "../variants";
import type { PaymentGatewayProps } from "../types";
import type { UsePaymentDetail } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();
const emit = defineEmits(["resolve", "reject", "cancel"]);
const { t } = useI18n();

const paymentDetail = inject<UsePaymentDetail>("usePaymentDetail");
if (!paymentDetail)
  throw new DetailedError(
    t("error.payment_gateway_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );

const {
  meta,
  errors,
  validationErrors,
  model,
  schema,
  uischema,
  clear,
  input,
  update,
  render,
  clickwrap: _clickwrap,
  instructions,
  gateway
} = usePaymentGateway(paymentDetail.gateway);

const container = useTemplateRef("container");

const selectedPaymentMethod = ref("selected-gateway");

const _action = computed(() => {
  // if (meta.value.payLater) return t("action.place_order_pay_later");
  if (!meta.value.needsPayment) return t("action.place_order");
  return t("action.place_order_and_pay");
});

const _handleCheckout = () => {
  emit("resolve");
};

const clearGateway = () => {
  emit("cancel");
};
// --- side effects

// Re-render when gateway enters rendering state (handles gateway switches)
watch(
  () => meta.value.isRendering,
  rendering => {
    if (rendering && container.value) {
      render(container.value);
    }
  },
  { immediate: true, flush: "post" }
);
// Render gateway on mount
onMounted(() => {
  render(container.value);
});
onUnmounted(() => {
  clearGateway();
});
</script>
