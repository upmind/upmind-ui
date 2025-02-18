<template>
  <article v-auto-animate>
    <ContentSection v-auto-animate>
      <Interstitial
        open
        modal
        skrim="light"
        :order-id="orderId"
        :success="success"
        :title="t(title)"
        :text="t(text)"
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
          size: '4xl',
        }"
        :uiConfig="config.order"
      >
        <template #title>
          <SmartTitle :i18n-key="title" size="2xl" />
        </template>

        <template #actions>
          <Button
            color="primary"
            :label="t(action)"
            :loading="processing"
            @click.stop="doAction"
          >
            <template #prepend>
              <Icon v-if="!meta.isAuthenticated" icon="arrow-left" size="2xs" />
            </template>

            <template #append>
              <Icon v-if="meta.isAuthenticated" icon="arrow-right" size="2xs" />
            </template>
          </Button>
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

// --- internal
import { useSession, utils } from "@upmind-automation/headless-vue";
import config from "./order.config";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { transfer: transferSession, meta } = useSession();

const orderId = route.params.orderId.toString();
const success = computed(() => route.query.payment_success === "true");

const title = computed(() => {
  if (!meta.value.isAuthenticated) {
    return "order.confirmation.invalid.title";
  } else if (success.value) {
    return "order.confirmation.success.title";
  }

  return "order.confirmation.failed.title";
});

const text = computed(() => {
  if (!meta.value.isAuthenticated) {
    return "order.confirmation.invalid.text";
  } else if (success.value) {
    return "order.confirmation.success.text";
  }

  return "order.confirmation.failed.text";
});

const action = computed(() => {
  if (!meta.value.isAuthenticated) {
    return "order.confirmation.invalid.action";
  } else if (success.value) {
    return "order.confirmation.success.action";
  }

  return "order.confirmation.failed.action";
});

const icon = computed(() => {
  if (success.value) {
    return "confetti";
  }

  if (!success.value) {
    return "error";
  }
  return "basket";
});

// -----------------------------------------------------------------------------

const processing = ref(false);

function doAction() {
  if (!meta.value.isAuthenticated) {
    processing.value = false;
    // @ts-ignore
    const storefrontUrl: string = import.meta.env.VITE_APP_STOREFRONT;
    window.location.href = storefrontUrl;
    return;
  }

  processing.value = true;
  transferSession()
    .then(transfer => {
      if (transfer?.code) {
        window.location.href = utils
          .useUrl(
            "auth/transfer",
            {
              code: transfer.code,
              redirect: `/billing/orders/${orderId}/overview`,
            },
            { base: transfer.redirect_url, context: "" }
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
