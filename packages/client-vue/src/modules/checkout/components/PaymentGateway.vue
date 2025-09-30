<template>
  <transition-group
    tag="div"
    ref="form"
    :class="styles.checkout.gateway"
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-y-10 transform opacity-0"
    enter-to-class="translate-y-0 transform opacity-100"
    leave-active-class="absolute transition duration-100 ease-in"
    leave-from-class="translate-y-0 transform opacity-100"
    leave-to-class="-translate-y-1 transform opacity-0"
    appear
  >
    <Spinner size="xs" v-if="meta.isAvailable" key="spinner" />

    <!-- Instructions -->
    <Markdown
      v-if="instructions"
      class="m-0 w-full p-0"
      :model-value="instructions"
    />

    <!-- gateway Render Content (* IF Provided) -->
    <div
      ref="container"
      class="w-full empty:hidden"
      v-show="!meta.isLoading"
      key="render"
    ></div>

    <!-- gateway Form (* IF Provided) -->
    <Form
      key="form"
      v-if="schema && uischema && !meta.isRenderless"
      v-show="!meta.isLoading"
      class="w-full"
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

    <Alert
      v-if="meta.hasErrors"
      color="error"
      icon="alert-triangle"
      :title="t('text.payment_failed')"
    >
      <div class="mt-2 text-sm">
        <li class="my-0 py-0">
          {{ errors }}
        </li>
      </div>
    </Alert>

    <footer key="actions" :class="styles.checkout.footer.root">
      <div :class="styles.checkout.footer.actions">
        <Button
          :disabled="meta.isProcessing"
          :loading="meta.isLoading"
          :color="props.color"
          size="lg"
          @click.prevent="handleCheckout"
          :label="action"
          :class="styles.checkout.action"
          pill
        />

        <p v-if="meta.needsPayment" :class="styles.checkout.additional">
          <Icon icon="lock" size="nano" />
          {{ t("cart.encrypted_and_secure_payments") }}
        </p>
      </div>

      <Markdown
        v-if="clickwrap"
        tag="p"
        :class="styles.checkout.clickwrap"
        :model-value="clickwrap"
        :keys="{ action }"
      />

      <TermsAndConditions
        v-else
        :class="styles.checkout.footer.terms"
        :label="action"
      />
    </footer>
  </transition-group>
</template>

<script lang="ts" setup>
// --- external
import {
  onMounted,
  watch,
  useTemplateRef,
  type ComputedRef,
  computed
} from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";

// --- components
import {
  Spinner,
  Alert,
  Markdown,
  Button,
  Icon
} from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- utils
import { isFunction } from "lodash-es";
// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();
const emit = defineEmits(["checkout"]);

const {
  meta,
  errors,
  validationErrors,
  model,
  schema,
  uischema,
  renderer,
  type,
  clear,
  input,
  update,
  render,
  clickwrap,
  instructions
} = useBasketPaymentGateway();

const { t } = useI18n();

const container = useTemplateRef("container");

const styles = useStyles(
  ["checkout", "checkout.footer"],
  meta,
  config
) as ComputedRef<{
  checkout: {
    gateway: string;
    content: string;
    footer: {
      root: string;
      actions: string;
      terms: string;
    };
    action: string;
    additional: string;
    terms: string;
    clickwrap: string;
  };
}>;

const action = computed(() => {
  if (!meta.value.needsPayment) return t("action.place_order");

  // if (meta.value.payLater) return t("action.place_order_pay_later");

  return t("action.place_order_and_pay");
});

const handleCheckout = () => {
  emit("checkout");
};

// --- side effects

// wait till we mount then try to render the gateway if it's provided
// otherwise watch in case it's provided later
onMounted(() => {
  render(container.value);
});
</script>
