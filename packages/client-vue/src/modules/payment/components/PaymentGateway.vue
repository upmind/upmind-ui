<template>
  <RadioCards
    v-model="selectedPaymentMethod"
    required
    :items="[
      {
        id: 'selected-gateway',
        value: 'selected-gateway',
        index: 0,
        modelValue: selectedPaymentMethod,
        label: gateway?.name,
        action: props.singleGateway
          ? undefined
          : {
              label: t('action.change'),
              handler: clearGateway
            }
      }
    ]"
  />

  <div ref="form" :class="styles.payment.gateway.form">
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
      color="danger"
      variant="minimal"
      icon="alert-triangle"
      :title="t('text.payment_failed')"
    >
      <ol class="text-sm-tight mt-2 list-none text-left">
        <li class="my-0 py-0">
          {{ error ?? errors }}
        </li>
      </ol>
    </Alert>

    <!-- Unsupported Message -->
    <Alert
      v-if="meta.isNotSupported || meta.isUnavailable"
      icon="info-circle"
      variant="minimal"
      :title="t('error.payment_gateway_not_supported_title')"
      :description="errors ?? t('error.payment_gateway_not_supported_msg')"
      class="text-error!"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
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

// --- internal
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  usePaymentGateway
} from "@upmind-automation/headless";
import config from "../payment.config";
import { useStyles, Loading } from "@upmind-automation/upmind-ui";

// --- components
import { Alert, Markdown, RadioCards } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- types
import type { UsePaymentDetail } from "@upmind-automation/headless";
import type { PaymentGatewayProps } from "../types";

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
  clickwrap,
  instructions,
  gateway
} = usePaymentGateway(paymentDetail.gateway);

const container = useTemplateRef("container");

const selectedPaymentMethod = ref("selected-gateway");

const styles = useStyles(
  ["payment", "payment.footer", "payment.gateway"],
  meta,
  config
);

const action = computed(() => {
  // if (meta.value.payLater) return t("action.place_order_pay_later");
  if (!meta.value.needsPayment) return t("action.place_order");
  return t("action.place_order_and_pay");
});

const handleCheckout = () => {
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
