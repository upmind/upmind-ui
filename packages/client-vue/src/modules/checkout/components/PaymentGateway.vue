<template>
  <Loading :active="!meta.isAvailable || meta.isLoading">
    <div ref="form" :class="styles.checkout.gateway">
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

      <!-- Actions and Terms -->
      <footer key="actions" :class="styles.checkout.footer.root">
        <div :class="styles.checkout.footer.actions">
          <Button
            :disabled="!meta.isValid"
            :loading="meta.isProcessing"
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
    </div>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { onMounted, useTemplateRef, type ComputedRef, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless";
import config from "../checkout.config";
import { useStyles, Loading } from "@upmind-automation/upmind-ui";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";

// --- components
import { Alert, Markdown, Button, Icon } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- utils

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
