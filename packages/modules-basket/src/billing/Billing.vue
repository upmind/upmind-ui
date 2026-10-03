<template>
  <LayoutProvider>
    <slot :template="template" />

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

    <template #back>
      <slot name="back">
        <!-- One-page reaches billing as a checkout sub-step, so it needs a Back;
             stepped billing templates never showed one. -->
        <Back
          v-if="template === BILLING_TEMPLATE.INSET"
          :label="t('action.back')"
          icon="arrow-narrow-left"
          size="md"
          @click.prevent="navigateBack"
        />
      </slot>
    </template>

    <template #content>
      <slot name="content">
        <BillingForm
          expand
          :auto-update="false"
          :card="template === BILLING_TEMPLATE.INSET"
          :inline="
            template === BILLING_TEMPLATE.INSET ||
            template === BILLING_TEMPLATE.ENCLOSED ||
            template === BILLING_TEMPLATE.FULL
          "
          :inline-editing="template === BILLING_TEMPLATE.INSET"
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
        <div
          id="billing-actions"
          :class="
            template === BILLING_TEMPLATE.ENCLOSED ||
            template === BILLING_TEMPLATE.FULL
              ? 'max-w-3xl'
              : ''
          "
        />
      </slot>
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { Markdown } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import {
  useConfig,
  useRoutingEngine,
  validateTemplate
} from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import BillingForm from "./components/BillingForm.vue";
import { BILLING_TEMPLATE } from "./types";
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

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    BILLING_TEMPLATE,
    BILLING_TEMPLATE.TWO_COLUMN_RTL
  )
);
</script>
