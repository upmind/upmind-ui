<template>
  <component :is="templateVariant">
    <template v-if="!isSlotHidden('hero')" #hero>
      <slot name="hero">
        <Hero
          :title="t('billing.your_details')"
          :description="t('billing.your_details_msg')"
          :badge="{
            label: t('text.fully_encrypted_title'),
            icon: 'lock-04'
          }"
          :action="{
            label: t('action.back_to_basket'),
            icon: 'flip-backward',
            color: 'primary',
            variant: 'subtle',
            size: 'lg',
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
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useConfig,
  useRoutingEngine,
  validateTemplate
} from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import {
  useThemes,
  Markdown,
  useTestAttrs
} from "@upmind-automation/upmind-ui";
import Hero from "../../components/hero/Hero.vue";
import Back from "../../components/navigation/Back.vue";
import BillingForm from "./components/BillingForm.vue";
import BillingEnclosedTemplate from "./templates/BillingEnclosed.template.vue";
import BillingFullTemplate from "./templates/BillingFull.template.vue";
import BillingLTRTemplate from "./templates/BillingLTR.template.vue";
import BillingRTLTemplate from "./templates/BillingRTL.template.vue";
import { BILLING_TEMPLATE } from "./types";
import { get, includes } from "lodash-es";
import type { BillingProps } from "./types";
import BillingInsetTemplate from "./templates/BillingInset.template.vue";

const supportedTemplates = {
  [BILLING_TEMPLATE.FULL]: BillingFullTemplate,
  [BILLING_TEMPLATE.TWO_COLUMN_LTR]: BillingLTRTemplate,
  [BILLING_TEMPLATE.TWO_COLUMN_RTL]: BillingRTLTemplate,
  [BILLING_TEMPLATE.ENCLOSED]: BillingEnclosedTemplate,
  [BILLING_TEMPLATE.INSET]: BillingInsetTemplate
};

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BillingProps>(), {
  hideSlots: () => []
});

const { t } = useI18n();
const { set } = useThemes();
const { navigateBack, navigateNext, isNavigating } = useRoutingEngine();

const { ui, data } = useConfig({
  context: UIContext.BILLING_DETAILS,
  provide: true
});

set(ui.theme.value);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const summaryAppendTestAttrs = useTestAttrs({ key: "slots:summary-append" });

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    BILLING_TEMPLATE,
    BILLING_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));
</script>
