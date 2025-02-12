<template>
  <article v-auto-animate>
    <ContentSection v-auto-animate>
      <OrderConfirmation
        open
        modal
        skrim="light"
        :order-id="orderId"
        :success="success"
        :text="orderText"
        :action="orderAction"
        :animated-icon="{
          icon: orderIcon,
          trigger: 'loop',
          primaryColor: 'base-foreground',
          secondaryColor: 'tertiary',
          size: '4xl',
        }"
      >
        <template #title>
          <i18n-t
            v-if="!meta.isAuthenticated"
            keypath="order.confirmation.invalid.title"
            tag="span"
            for="order.confirmation.invalid.title"
            class="text-primary font-bold"
          >
            <mask class="bg-accent leading-relaxed">{{
              t("order.confirmation.invalid.session")
            }}</mask>
          </i18n-t>
          <i18n-t
            v-else-if="success"
            keypath="order.confirmation.success.title"
            tag="span"
            for="order.confirmation.success.title"
            class="text-primary font-bold"
          >
            <mask class="bg-accent leading-relaxed">{{
              t("order.confirmation.success.complete")
            }}</mask>
          </i18n-t>
          <i18n-t
            v-else
            keypath="order.confirmation.failed.title"
            tag="span"
            for="order.confirmation.failed.title"
            class="text-primary font-bold"
          >
            <mask class="bg-accent leading-relaxed">{{
              t("order.confirmation.failed.process")
            }}</mask>
          </i18n-t>
        </template>
      </OrderConfirmation>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/client-vue";

// -- components
import OrderConfirmation from "./components/Confirmation.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();

const { meta } = useSession();

const orderId = route.params.orderId.toString();
const success = computed(() => route.query.payment_success === "true");

const orderText = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("order.confirmation.invalid.text");
  } else if (success.value) {
    return t("order.confirmation.success.text");
  }

  return t("order.confirmation.failed.text");
});

const orderActionLabel = computed(() => {
  if (!meta.value.isAuthenticated) {
    return t("order.confirmation.invalid.action");
  } else if (success.value) {
    return t("order.confirmation.success.action");
  }

  return t("order.confirmation.failed.action");
});

const orderIcon = computed(() => {
  if (success.value) {
    return "confetti";
  }

  if (!success.value) {
    return "error";
  }
  return "basket";
});

const orderAction = computed(() => {
  const action = {
    color: "primary",
    prependIcon: "",
    appendIcon: "",
    label: orderActionLabel.value,
  };

  if (!meta.value.isAuthenticated) {
    action.prependIcon = "arrow-left";
  } else if (success.value) {
    action.appendIcon = "arrow-right";
  } else {
    action.appendIcon = "arrow-right";
  }

  return action;
});
</script>
