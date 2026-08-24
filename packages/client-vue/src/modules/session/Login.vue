<template>
  <Loading v-if="isResolving" />
  <component :is="templateVariant" v-bind="props" v-else>
    <template #back>
      <slot name="back">
        <!-- One-page uses the compact "← Back" per the designs; other templates
             keep the default "Back to basket". -->
        <Back
          :label="meta.isInset ? t('action.back') : t('action.back_to_basket')"
          :icon="meta.isInset ? 'arrow-narrow-left' : undefined"
          size="md"
          :color="meta.isInset ? 'muted' : 'default'"
          @click.prevent="doReject"
        />
      </slot>
    </template>

    <template #hero>
      <slot name="hero">
        <Hero :title="t('auth.login_title')">
          <template #subtitle>
            <i18n-t keypath="auth.login_description" scope="global" tag="span">
              <template #[`login_description_action`]>
                <Link
                  :to="props.registerRoute"
                  size="inherit"
                  color="inherit"
                  class="font-normal"
                  >{{ t("auth.login_description_action") }}</Link
                >
              </template>
            </i18n-t>
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <!-- One-page titles the form "Log in" as a card with a "Create Account"
             header cross-link (one-page drops the hero); other templates keep the
             plain section. -->
        <Section
          :card="meta.isInset"
          :label="t('action.login')"
          value="log-in"
          icon="user-03"
          v-show="!isAuthenticated"
          :class="sessionFormWidthVariants({ inset: meta.isInset })"
          :active="templateMeta.hasActiveSection"
        >
          <template v-if="meta.isInset" #actions>
            <Link
              color="muted"
              size="sm"
              @click.prevent="doUpdate('register')"
              >{{ t("action.create_account") }}</Link
            >
          </template>

          <Markdown
            v-if="templateMeta.hasActiveSection && loginTemplate?.body"
            tag="section"
            :model-value="loginTemplate.body"
          />
          <Auth
            class="rounded-card w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="login"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />
        </Section>
      </slot>
    </template>

    <template v-if="ui.basketSummary.isVisible" #summary>
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

    <template
      v-if="loginTemplate?.body && templateMeta.hasMarkdownSlot"
      #markdown
    >
      <Markdown
        tag="section"
        :class="templateMeta.isSplit ? '' : markdownVariants()"
        :model-value="loginTemplate.body"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  useConfig,
  validateTemplate,
  useClientTemplate,
  useBrand
} from "@upmind-automation/headless";
import {
  useBasket,
  useRoutingEngine,
  useActiveSession,
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import { Link, Markdown } from "@upmind/ui";
import Hero from "../../components/hero/Hero.vue";
import Back from "../../components/navigation/Back.vue";
import Section from "../../components/section/Section.vue";
import Summary from "../basket/components/Summary.vue";
import Loading from "../system/Loading.vue";
import { useThemes } from "../theming";
import Auth from "./components/Auth.vue";
import { useSessionTemplates } from "./session.utils";
import SessionCanvasCardTemplate from "./templates/SessionCanvasCard.template.vue";
import SessionEnclosedTemplate from "./templates/SessionEnclosed.template.vue";
import SessionInsetTemplate from "./templates/SessionInset.template.vue";
import SessionLTRTemplate from "./templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./templates/SessionRTL.template.vue";
import SessionSplitTemplate from "./templates/SessionSplit.template.vue";
import SessionSurfaceBoxTemplate from "./templates/SessionSurfaceBox.template.vue";
import {
  type SessionProps,
  type SessionRoutes,
  SESSION_TEMPLATE
} from "./types";
import { markdownVariants, sessionFormWidthVariants } from "./variants";
import { get } from "lodash-es";

const supportedTemplates = {
  [SESSION_TEMPLATE.SPLIT]: SessionSplitTemplate,
  [SESSION_TEMPLATE.CANVAS_CARD]: SessionCanvasCardTemplate,
  [SESSION_TEMPLATE.SURFACE_BOX]: SessionSurfaceBoxTemplate,
  [SESSION_TEMPLATE.TWO_COLUMN_LTR]: SessionLTRTemplate,
  [SESSION_TEMPLATE.TWO_COLUMN_RTL]: SessionRTLTemplate,
  [SESSION_TEMPLATE.ENCLOSED]: SessionEnclosedTemplate,
  [SESSION_TEMPLATE.INSET]: SessionInsetTemplate
};

// -----------------------------------------------------------------------------

const props = defineProps<
  SessionRoutes & {
    template?: SESSION_TEMPLATE;
  }
>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { set } = useThemes();

const { isAuthenticated } = useActiveSession().useMeta();
const { isReady } = useActiveSession().useActions();
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();

const { ui } = useConfig({
  context: UIContext.AUTH,
  provide: true
});
const { brandId } = useBrand();
const { data: loginTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.LOGIN_PAGE,
  objectId: brandId.value
});

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
const { meta: templateMeta } = useSessionTemplates(template);

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
