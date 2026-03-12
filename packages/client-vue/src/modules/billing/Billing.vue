<template>
  <Transitions>
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
              size: 'lg'
            }"
            @action="navigateBack"
          />
        </slot>
      </template>

      <template #content>
        <slot name="content">
          <BillingForm expand :auto-update="false" />
        </slot>
      </template>

      <template
        v-if="ui.trustMessaging.isVisible && data.trustMessagingMarkdown"
        #markdown
      >
        <slot name="markdown">
          <Markdown
            data-testid="slots:summary-append"
            :model-value="data.trustMessagingMarkdown"
          />
        </slot>
      </template>
    </component>
  </Transitions>
</template>

<script lang="ts" setup>
// --- external
import { computed, onUnmounted, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useConfig,
  useRoutingEngine,
  validateTemplate
} from "@upmind-automation/headless";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useThemes, Markdown } from "@upmind-automation/upmind-ui";

// --- components
import Hero from "../../components/hero/Hero.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";
import BillingForm from "./components/BillingForm.vue";

// --- templates
const supportedTemplates = {
  [BILLING_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/BillingFull.template.vue")
  ),
  [BILLING_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/BillingLTR.template.vue")
  ),
  [BILLING_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/BillingRTL.template.vue")
  ),
  [BILLING_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/BillingEnclosed.template.vue")
  )
};

// --- utils
import { get, includes } from "lodash-es";

// --- types
import { BILLING_TEMPLATE } from "./types";
import type { BillingProps } from "./types";
import { UIContext } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BillingProps>(), {
  hideSlots: () => []
});

const { t } = useI18n();
const { set } = useThemes();
const { navigateBack } = useRoutingEngine();

const { ui, data } = useConfig({
  context: UIContext.BILLING_DETAILS,
  provide: true
});

set(ui.theme.value);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    BILLING_TEMPLATE,
    BILLING_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

// -----------------------------------------------------------------------------

onUnmounted(() => {
  useFooter({});
  useHeader({});
});
</script>
