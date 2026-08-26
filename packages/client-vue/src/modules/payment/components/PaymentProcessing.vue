<template>
  <Interstitial
    :close-label="t('action.close')"
    open
    modal
    :animatedIcon="{
      icon: 'tapping-card',
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      size: 'xl'
    }"
    :title="processingTitle"
    :text="processingText"
  >
    <template #icon v-if="meta.isRenderingChallenge">
      <!-- hide the avatar on rendering challenge -->
      <span class="sr-only">{{ processingTitle }}</span>
    </template>

    <!-- Challenge render container -->
    <div
      ref="container"
      class="mt-4 h-full w-full border-none empty:hidden"
      key="challenge-render"
    ></div>
  </Interstitial>
</template>

<script lang="ts" setup>
import { Interstitial } from "@upmind/ui";
import { computed, inject, watch, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "@upmind-automation/headless";
import type { UseOrder } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const challenge = inject<{
  renderChallenge: UseOrder["renderChallenge"];
  cancelChallenge: UseOrder["cancelChallenge"];
  meta: UseOrder["meta"];
}>("usePaymentChallenge");

if (!challenge) {
  throw new DetailedError(
    t("error.payment_gateway_not_available"),
    responseCodes.Not_Found,
    ErrorOrigin.Headless
  );
}

const { meta, renderChallenge } = challenge;
const container = useTemplateRef("container");

watch(
  [() => meta.value.isRenderingChallenge, container],
  ([rendering, el]) => {
    if (rendering && el) {
      renderChallenge(el);
    }
  },
  { immediate: true, flush: "post" }
);

const processingTitle = computed(() => {
  if (meta.value.isRenderingChallenge) {
    return t("cart.payment_challenge_title_md");
  }

  if (meta.value.needsApproval) {
    return t("cart.payment_awaiting_approval_md");
  }

  return t("cart.payment_processing_md");
});

const processingText = computed(() => {
  if (meta.value.isRenderingChallenge) {
    return t("cart.payment_challenge_msg");
  }

  if (meta.value.needsApproval) {
    return t("cart.payment_awaiting_approval_msg");
  }

  return t("cart.payment_processing_msg");
});
</script>
