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
        <Hero :title="t('action.create_account')">
          <template #subtitle>
            <span class="font-normal"
              >{{ t("auth.register_description") }}&nbsp;</span
            >

            <Link
              :to="props.loginRoute"
              size="inherit"
              color="inherit"
              :label="t('action.log_in_here')"
              class="font-normal"
            />

            <div
              v-if="meta.canRegisterAsGuest"
              :class="styles.session.guestCheckout.root"
            >
              <span>{{ t("auth.guest_checkout_qn") }}&nbsp;</span>
              <Link
                @click="registerAsGuest"
                size="inherit"
                color="inherit"
                :label="t('auth.guest_checkout_label')"
              />
            </div>
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <!-- Authenticated guest customer — complete registration to upgrade to a full account -->
        <GuestRegistration v-if="meta.isGuestClient" auto-show />

        <Section
          v-else
          :label="t('action.register')"
          icon="user-03"
          v-show="!meta.isAuthenticated"
          class="max-w-3xl"
          :active="templateMeta.hasActiveSection"
        >
          <Markdown
            v-if="templateMeta.hasActiveSection && registerTemplate?.body"
            tag="div"
            :model-value="registerTemplate.body"
          />
          <Auth
            v-show="!meta.isLoading"
            class="rounded-box w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="register"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />

          <div
            v-if="meta.isLoading"
            class="flex w-full max-w-5xl flex-col gap-6"
          >
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

    <template
      v-if="ui.basketSummary.isVisible || meta.canRegisterAsGuest"
      #summary
    >
      <slot name="summary">
        <Section
          v-if="
            ui.basketSummary.isVisible &&
            (basketMeta.hasProducts || basketMeta.isLoading)
          "
          :label="t('cart.basket_section')"
          icon="shopping-bag-02"
        >
          <Summary :showPromotions="false" show-products />
        </Section>

        <!-- Alternative guest-checkout CTA placement: sidebar card.
             Mirrors the inline hero CTA — kept in parallel so both
             placements can be evaluated. -->
        <Section
          v-if="meta.canRegisterAsGuest"
          :label="t('auth.guest_checkout_qn')"
          icon="zap"
        >
          <div :class="styles.session.guestCheckout.sidebar">
            <p :class="styles.session.guestCheckout.sidebarText">
              {{ t("auth.guest_checkout_description") }}
            </p>
            <Button
              variant="outline"
              :label="t('auth.guest_checkout_label')"
              @click="registerAsGuest"
            />
          </div>
        </Section>
      </slot>
    </template>

    <template
      v-if="registerTemplate?.body && templateMeta.hasMarkdownSlot"
      #markdown
    >
      <Markdown
        tag="div"
        :class="templateMeta.isSplit ? '' : styles.session.markdown"
        :model-value="registerTemplate.body"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
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
import { Button, Link, Markdown, Skeleton } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import GuestRegistration from "./components/GuestRegistration.vue";
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
  UIContext,
  ClientTemplateSlotCodes
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

const { meta, isReady, registerAsGuest } = useSession();
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();
const { brandId } = useBrand();

const styles = useStyles(["session"], {}, sessionConfig);

const { ui } = useConfig({
  context: UIContext.AUTH,
  provide: true
});
const { data: registerTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.REGISTER_PAGE,
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
</script>
