<template>
  <component :is="templateVariant" v-bind="props" v-if="!isResolving">
    <template #back>
      <slot name="back">
        <Back />
      </slot>
    </template>

    <template #hero>
      <slot name="hero">
        <Hero :title="t('auth.welcome_back')">
          <template #description>
            <i18n-t
              keypath="auth.please_login_to_continue"
              scope="global"
              tag="span"
            >
              <template #[`create_one_here`]>
                <Link
                  :to="props.registerRoute"
                  size="inherit"
                  color="inherit"
                  :label="t('auth.create_one_here')"
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
        >
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
import { useConfig } from "@upmind-automation/headless";
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import { Link } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Hero from "../../components/hero/Hero.vue";
import Back from "./components/Back.vue";
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
const {
  navigateNext,
  navigateBack,
  navigate,
  meta: routingMeta
} = useRoutingEngine();

const { ui } = useConfig({
  context: UIContext.AUTH
});

await isReady();

set(ui.theme.value);

const isResolving = ref(false);

const template = computed(() => props.template || ui.template.value);

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    template.value,
    supportedTemplates[SESSION_TEMPLATE.TWO_COLUMN_LTR]
  )
);

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
