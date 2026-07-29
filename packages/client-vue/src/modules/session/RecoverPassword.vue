<template>
  <component :is="templateVariant" v-bind="props" v-if="!isResolving">
    <template #back>
      <slot name="back">
        <!-- One-page uses the compact "← Back" per the designs; other templates
             keep the default "Back to login". -->
        <Back
          :label="meta.isInset ? t('action.back') : t('action.back_to_login')"
          :icon="meta.isInset ? 'arrow-narrow-left' : 'arrow-left'"
          :size="meta.isInset ? 'md' : 'lg'"
          :color="meta.isInset ? 'muted' : 'default'"
          @click.prevent="doReject"
        />
      </slot>
    </template>

    <template #hero>
      <slot name="hero">
        <Hero :title="t('text.forgot_your_password_qn')">
          <template #subtitle>
            <i18n-t
              keypath="auth.forgot_password_help"
              scope="global"
              tag="span"
            >
              <template #[`log_in_here`]>
                <Link
                  :to="props.loginRoute"
                  size="inherit"
                  color="inherit"
                  :label="t('action.log_in_here')"
                  class="font-normal"
                />
              </template>
            </i18n-t>
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <!-- One-page renders the form as a titled card; other templates keep the
             plain section. The Back button already returns to login, so no header
             cross-link is needed either way. -->
        <Section
          :card="meta.isInset"
          :label="t('action.recover_password')"
          icon="user-03"
          :class="styles.session.formWidth"
          v-show="!sessionMeta.isAuthenticated"
        >
          <Auth
            class="rounded-box w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="recover"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />
        </Section>
      </slot>
    </template>

    <template #summary>
      <slot name="summary">
        <Section
          v-if="basketMeta.hasProducts"
          :label="t('cart.basket_section')"
          icon="shopping-bag-02"
        >
          <Summary :showPromotions="false" show-products />
        </Section>
      </slot>
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig, validateTemplate } from "@upmind-automation/headless";
import { useThemes, useStyles } from "@upmind-automation/upmind-ui";
import sessionConfig from "./session.config";

// --- components
import { Link } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Back from "../../components/navigation/Back.vue";
import Hero from "../../components/hero/Hero.vue";
import Section from "../../components/section/Section.vue";
import Summary from "../basket/components/Summary.vue";

// --- templates
import SessionSplitTemplate from "./templates/SessionSplit.template.vue";
import SessionCanvasCardTemplate from "./templates/SessionCanvasCard.template.vue";
import SessionSurfaceBoxTemplate from "./templates/SessionSurfaceBox.template.vue";
import SessionLTRTemplate from "./templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./templates/SessionRTL.template.vue";
import SessionEnclosedTemplate from "./templates/SessionEnclosed.template.vue";
import SessionInsetTemplate from "./templates/SessionInset.template.vue";

const supportedTemplates = {
  [SESSION_TEMPLATE.SPLIT]: SessionSplitTemplate,
  [SESSION_TEMPLATE.CANVAS_CARD]: SessionCanvasCardTemplate,
  [SESSION_TEMPLATE.SURFACE_BOX]: SessionSurfaceBoxTemplate,
  [SESSION_TEMPLATE.TWO_COLUMN_LTR]: SessionLTRTemplate,
  [SESSION_TEMPLATE.TWO_COLUMN_RTL]: SessionRTLTemplate,
  [SESSION_TEMPLATE.ENCLOSED]: SessionEnclosedTemplate,
  [SESSION_TEMPLATE.INSET]: SessionInsetTemplate
};

// --- utils
import { get } from "lodash-es";

// --- types
import {
  type SessionProps,
  type SessionRoutes,
  SESSION_TEMPLATE
} from "./types";
import {
  useBasket,
  useRoutingEngine,
  useSession,
  UIContext
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  SessionRoutes & {
    template?: SESSION_TEMPLATE;
  }
>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { set } = useThemes();

const { meta: sessionMeta, isReady } = useSession();
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();

const { ui } = useConfig({
  context: UIContext.AUTH,
  provide: true
});

const styles = useStyles(
  ["session", "session.formWidth"],
  computed(() => ({
    template: template.value
  })),
  sessionConfig
);

await isReady();

set(ui.theme.value);

const isResolving = ref(false);

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    SESSION_TEMPLATE,
    SESSION_TEMPLATE.TWO_COLUMN_LTR
  )
);

const meta = computed(() => ({
  isInset: template.value === SESSION_TEMPLATE.INSET
}));

const templateVariant = computed(() => get(supportedTemplates, template.value));

function doUpdate(value: SessionProps["modelValue"]) {
  if (value === "login") {
    const target = props.loginRoute.name?.toString();
    if (target) navigate(target);
  } else if (value === "register") {
    const target = props.registerRoute.name?.toString();
    if (target) navigate(target);
  } else if (value === "recover") {
    const target = props.recoverRoute.name?.toString();
    if (target) navigate(target);
  }
}

function doReject() {
  isResolving.value = true;
  navigateBack().catch(() => {
    isResolving.value = false;
  });
}

function doResolve() {
  isResolving.value = true;
  navigateNext().catch(() => {
    isResolving.value = false;
  });
}
</script>
