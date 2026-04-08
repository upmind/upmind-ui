<template>
  <Loading v-if="isResolving" />
  <component :is="templateVariant" v-bind="props" v-else>
    <template #back>
      <slot name="back">
        <Back />
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
                  :label="t('auth.login_description_action')"
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
        <Section
          :label="t('action.login')"
          icon="user-03"
          v-show="!meta.isAuthenticated"
          class="max-w-3xl"
          :active="templateMeta.hasActiveSection"
        >
          <Markdown
            v-if="templateMeta.hasActiveSection"
            tag="section"
            :model-value="loginTemplate.body"
          />
          <Auth
            class="rounded-box w-full max-w-5xl items-start"
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
        :class="templateMeta.isSplit ? '' : styles.session.markdown"
        :model-value="loginTemplate.body"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, defineAsyncComponent, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";
import {
  useConfig,
  validateTemplate,
  useClientTemplate,
  useBrand
} from "@upmind-automation/headless";
import { useThemes, useStyles } from "@upmind-automation/upmind-ui";
import sessionConfig from "./session.config";
import { useSessionTemplates } from "./session.utils";

// --- components
import { Link, Markdown } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Hero from "../../components/hero/Hero.vue";
import Back from "./components/Back.vue";
import Loading from "../system/Loading.vue";
import Section from "../../components/section/Section.vue";
import Summary from "../basket/components/Summary.vue";

// --- templates
const supportedTemplates = {
  [SESSION_TEMPLATE.SPLIT]: defineAsyncComponent(
    () => import("./templates/SessionSplit.template.vue")
  ),
  [SESSION_TEMPLATE.CANVAS_CARD]: defineAsyncComponent(
    () => import("./templates/SessionCanvasCard.template.vue")
  ),
  [SESSION_TEMPLATE.SURFACE_BOX]: defineAsyncComponent(
    () => import("./templates/SessionSurfaceBox.template.vue")
  ),
  [SESSION_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/SessionLTR.template.vue")
  ),
  [SESSION_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/SessionRTL.template.vue")
  ),
  [SESSION_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/SessionEnclosed.template.vue")
  )
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
import { ClientTemplateSlotCodes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const props = defineProps<
  SessionRoutes & {
    template?: SESSION_TEMPLATE;
  }
>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { set } = useThemes();

const { meta, isReady } = useSession();
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();

const styles = useStyles(["session"], {}, sessionConfig);

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

onUnmounted(() => {
  useLayout({});
  useFooter({});
  useHeader({});
});
</script>
