<template>
  <Alert
    v-if="meta.isUnavailable"
    color="warning"
    icon="alert-triangle"
    variant="minimal"
    :title="t('error.payment_gateway_not_available')"
    class="text-error!"
    :description="errors"
  />

  <Loading
    v-else
    :active="!meta.isNotSupported && (!meta.isAvailable || meta.isLoading)"
    :class="styles.checkout.gateway.root"
  >
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
          action: {
            label: t('action.change'),
            handler: clearGateway
          }
        }
      ]"
    />

    <div ref="form" :class="styles.checkout.gateway.form">
      <!-- Instructions -->
      <Markdown
        v-if="instructions"
        class="m-0 w-full p-0"
        :model-value="instructions"
      />

      <!-- gateway Render Content (* IF Provided) -->
      <div ref="container" class="w-full empty:hidden" key="render"></div>

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
        v-if="meta.hasErrors"
        color="warning"
        variant="minimal"
        icon="alert-triangle"
        :title="t('text.payment_failed')"
      >
        <ol class="text-sm-tight mt-2 list-none text-left">
          <li class="my-0 py-0">
            {{ errors }}
          </li>
        </ol>
      </Alert>

      <!-- Unsupported Message -->
      <Alert
        v-if="meta.isNotSupported"
        icon="info-circle"
        variant="minimal"
        :title="t('error.payment_gateway_not_supported_title')"
        :description="t('error.payment_gateway_not_supported_msg')"
        class="text-error!"
      />
    </div>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import {
  onMounted,
  useTemplateRef,
  type ComputedRef,
  computed,
  ref
} from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles, Loading } from "@upmind-automation/upmind-ui";

// --- components
import {
  Alert,
  Markdown,
  Button,
  RadioCards
} from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();
const emit = defineEmits(["resolve", "reject", "cancel"]);

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
} = useBasketPaymentGateway();

const { t } = useI18n();

const container = useTemplateRef("container");

const selectedPaymentMethod = ref("selected-gateway");

const styles = useStyles(
  ["checkout", "checkout.footer", "checkout.gateway"],
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

// wait till we mount then try to render the gateway if it's provided
// otherwise watch in case it's provided later
onMounted(() => {
  render(container.value);
});
</script>
