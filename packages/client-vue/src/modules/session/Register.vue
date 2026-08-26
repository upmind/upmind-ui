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
        <Hero
          :title="
            isGuestClient
              ? t('auth.guest_register_title')
              : t('action.create_account')
          "
        >
          <template #subtitle>
            <!-- A guest client is upgrading, not choosing login vs register —
                 show the save-your-details prompt, not the log-in link. -->
            <span v-if="isGuestClient" :class="sessionSubtitleVariants()">{{
              t("auth.guest_register_description")
            }}</span>

            <template v-else>
              <span :class="sessionSubtitleVariants()"
                >{{ t("auth.register_description") }}&nbsp;</span
              >

              <Link
                :to="props.loginRoute"
                size="inherit"
                color="inherit"
                :data-attrs="{ 'data-test-key': 'checkout-login-link' }"
                class="font-normal"
                >{{ t("action.log_in_here") }}</Link
              >
            </template>
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <!-- One register form for new sign-ups AND guest-client upgrades; Auth
             picks the right form from the session machine (a guest client's
             upgrade form is owned by the client machine). Shown unless the user
             is a fully-registered client. One-page titles it "Create Account" as
             a card with a "Log in" cross-link (one-page drops the hero); other
             templates keep the plain section titled "Register". -->
        <Section
          :card="meta.isInset"
          :label="
            meta.isInset ? t('action.create_account') : t('action.register')
          "
          icon="user-03"
          :class="sessionFormWidthVariants({ inset: meta.isInset })"
          v-show="!isAuthenticated || isGuestClient"
          :active="templateMeta.hasActiveSection"
        >
          <template v-if="meta.isInset && !isGuestClient" #actions>
            <Link color="muted" size="sm" @click.prevent="doUpdate('login')">{{
              t("action.login")
            }}</Link>
          </template>

          <Markdown
            v-if="templateMeta.hasActiveSection && registerTemplate?.body"
            tag="div"
            :model-value="registerTemplate.body"
          />

          <Alert
            v-if="meta.offersGuestCheckout"
            variant="neutral"
            :title="t('auth.guest_checkout_qn')"
            :class="guestCheckoutVariants({ template })"
          >
            <template #icon><Icon icon="clock-fast-forward" /></template>
            <template #action>
              <Link
                size="sm"
                @click="registerAsGuest"
                color="inherit"
                :disabled="isRegisteringAsGuest"
                :data-attrs="{ 'data-test-key': 'guest-checkout-cta' }"
              >
                {{ t("auth.guest_checkout_action") }}
                <Spinner
                  :label="t('text.loading')"
                  v-if="isRegisteringAsGuest"
                  size="xs"
                  class="m-1.5"
                />
                <Icon
                  v-else
                  icon="arrow-right"
                  size="sm"
                  class="p-1.5 [&>svg]:size-3"
                />
              </Link>
            </template>
          </Alert>

          <Account
            v-if="isGuestClient"
            v-show="!isLoading && !basketMeta.isLoading"
            class="rounded-card w-full max-w-5xl items-start"
            @resolve="doResolve"
          />

          <Auth
            v-show="!isLoading && !basketMeta.isLoading"
            class="rounded-card w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="register"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />

          <div
            v-if="isLoading || basketMeta.isLoading"
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
                class="text-muted"
                href="https://policies.google.com/privacy"
                target="_blank"
                size="inherit"
                color="inherit"
                >{{ t("text.privacy_policy") }}</Link
              >
            </template>
            <template #[`termsOfService`]>
              <Link
                class="text-muted"
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

    <template v-if="ui.basketSummary.isVisible" #summary>
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

    <template
      v-if="registerTemplate?.body && templateMeta.hasMarkdownSlot"
      #markdown
    >
      <Markdown
        tag="div"
        :class="templateMeta.isSplit ? '' : markdownVariants()"
        :model-value="registerTemplate.body"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { Spinner } from "@upmind/ui";
import { Link, Markdown } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import { Alert } from "@upmind/ui";
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
  useAuth,
  ScopeActorTypes,
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import Hero from "../../components/hero/Hero.vue";
import { Icon } from "../../components/icon";
import Back from "../../components/navigation/Back.vue";
import Section from "../../components/section/Section.vue";
import Summary from "../basket/components/Summary.vue";
import Loading from "../system/Loading.vue";
import { useThemes } from "../theming";
import Account from "./components/Account.vue";
import Auth from "./components/Auth.vue";
import { offersGuestCheckout, useSessionTemplates } from "./session.utils";
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
import {
  guestCheckoutVariants,
  markdownVariants,
  sessionFormWidthVariants,
  sessionSubtitleVariants
} from "./variants";
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

const { isAuthenticated, isLoading, isGuestClient } =
  useActiveSession().useMeta();
const { isReady } = useActiveSession().useActions();

const auth = useAuth().as(ScopeActorTypes.CLIENT);
const { canRegisterAsGuest, isRegisteringAsGuest } = auth.useMeta();
const authActions = auth.useActions();
function registerAsGuest() {
  if ("registerAsGuest" in authActions)
    return authActions?.registerAsGuest().then(() => doResolve());
}
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();
const { brandId } = useBrand();

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

const meta = computed(() => ({
  isInset: template.value === SESSION_TEMPLATE.INSET,
  offersGuestCheckout: offersGuestCheckout({
    isAuthenticated: isAuthenticated.value,
    canRegisterAsGuest: canRegisterAsGuest.value,
    isBasketLoading: basketMeta.value.isLoading,
    hasRecurringProducts: basketMeta.value.hasRecurringProducts
  })
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
  if (isResolving.value) return;
  isResolving.value = true;
  navigateNext().catch(() => {
    isResolving.value = false;
  });
}
</script>
