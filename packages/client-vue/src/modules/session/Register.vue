<template>
  <component :is="templateVariant" v-bind="props">
    <template #back>
      <slot name="back">
        <Back />
      </slot>
    </template>

    <template #hero>
      <slot name="hero">
        <Hero :title="t('action.create_account')">
          <template #description>
            <span class="font-normal"
              >{{ t("auth.already_have_account_qn") }}&nbsp;</span
            >

            <Link
              :to="props.loginRoute"
              size="inherit"
              color="inherit"
              :label="t('action.log_in_here')"
              class="font-normal"
            />
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <Section
          :label="t('action.register')"
          icon="user-03"
          v-show="!meta.isAuthenticated"
        >
          <Auth
            v-if="isFormReady"
            class="rounded-box w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="register"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />

          <div v-else class="flex w-full max-w-5xl flex-col gap-6">
            <div>
              <Skeleton class="h-5 w-24" />
              <Skeleton class="mt-2 h-10 w-full" />
            </div>
            <div>
              <Skeleton class="h-5 w-24" />
              <Skeleton class="mt-2 h-10 w-full" />
            </div>
            <div>
              <Skeleton class="h-5 w-32" />
              <Skeleton class="mt-2 h-10 w-full" />
            </div>
            <div>
              <Skeleton class="h-5 w-28" />
              <Skeleton class="mt-2 h-10 w-full" />
            </div>
            <Skeleton class="h-12 w-full" />
          </div>

          <i18n-t
            class="text-muted text-sm"
            keypath="auth.recaptcha_terms_desc"
            tag="p"
            scope="global"
          >
            <template #[`privacyPolicy`]>
              <Link
                class="has-text-grey-light"
                href="https://policies.google.com/privacy"
                target="_blank"
                size="inherit"
                color="inherit"
                >{{ t("text.privacy_policy") }}</Link
              >
            </template>
            <template #[`termsOfService`]>
              <Link
                class="has-text-grey-light"
                href="https://policies.google.com/terms"
                target="_blank"
                size="inherit"
                color="inherit"
                >{{ t("text.terms_of_service") }}</Link
              >
            </template>
          </i18n-t>
        </Section>
      </slot>
    </template>

    <template #summary>
      <slot name="summary">
        <Section
          v-if="basketMeta.hasProducts || basketMeta.isLoading"
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
import { computed, defineAsyncComponent, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";

// --- components
import { Link, Skeleton } from "@upmind-automation/upmind-ui";
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
  useSession
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    SessionRoutes & {
      template?: SESSION_TEMPLATE;
    }
  >(),
  {
    template: SESSION_TEMPLATE.TWO_COLUMN_LTR
  }
);
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, schema, showRegister } = useSession();
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();

const isFormReady = computed(() => !!schema.value);

// Eagerly trigger schema loading so the form renders immediately
showRegister();

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
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
  navigateBack();
}

function doResolve() {
  navigateNext();
}

onUnmounted(() => {
  useLayout({});
  useFooter({});
  useHeader({});
});
</script>
