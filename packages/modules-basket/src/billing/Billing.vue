<template>
  <LayoutProvider>
    <slot :template="ui.template.value" />

    <template v-if="!isSlotHidden('hero')" #hero>
      <slot name="hero">
        <Hero
          :title="t('billing.your_details')"
          :description="t('billing.your_details_msg')"
          :badge="{
            label: t('text.fully_encrypted_title'),
            icon: 'lock-04',
            variant: 'neutral',
            appearance: 'outline'
          }"
          :action="{
            label: t('action.back_to_basket'),
            icon: 'flip-backward',
            disabled: isNavigating,
            dataAttrs: { 'data-test-key': 'link-back-to-basket' }
          }"
          size="3xl"
          @action="navigateBack"
        />
      </slot>
    </template>

    <template #back="{ showBack = false }">
      <slot name="back">
        <!-- One-page reaches billing as a checkout sub-step, so it needs a Back;
             stepped billing templates never showed one. -->
        <Back
          v-if="showBack"
          :label="t('action.back')"
          icon="arrow-narrow-left"
          size="md"
          @click.prevent="navigateBack"
        />
      </slot>
    </template>

    <template #content="{ card = false, inline = true, inlineEditing = false }">
      <slot name="content">
        <BillingForm
          expand
          :auto-update="false"
          :card="card"
          :inline="inline"
          :inline-editing="inlineEditing"
          @resolve="navigateNext()"
        />
      </slot>
    </template>

    <template
      v-if="ui.trustMessaging.isVisible && data.trustMessagingMarkdown"
      #markdown
    >
      <slot name="markdown">
        <Markdown
          v-bind="summaryAppendTestAttrs"
          :model-value="data.trustMessagingMarkdown"
        />
      </slot>
    </template>

    <template #content-footer>
      <slot name="content-footer">
        <div id="billing-actions" />
      </slot>
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { Markdown } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import { useConfig, useRoutingEngine } from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import BillingForm from "./components/BillingForm.vue";
import { includes } from "lodash-es";
import type { BillingProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BillingProps>(), {
  hideSlots: () => []
});

const { t } = useI18n();
const { navigateBack, navigateNext, isNavigating } = useRoutingEngine();

const { ui, data } = useConfig({
  context: UIContext.BILLING_DETAILS,
  provide: true
});

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const summaryAppendTestAttrs = useTestAttrs({ key: "slots:summary-append" });
</script>
