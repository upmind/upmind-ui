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
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <!-- One register form for new sign-ups AND guest-client upgrades; Auth
             picks the right form from the session machine (a guest client's
             upgrade form is owned by the client machine). Shown unless the user
             is a fully-registered client. -->
        <Section
          :label="t('action.register')"
          icon="user-03"
          v-show="!meta.isAuthenticated || meta.isGuestClient"
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

    <!-- Guest-checkout CTA — defined once; each template renders the `guest`
         slot in the right place (after the hero for single-column layouts,
         above the summary for two-column). -->
    <template v-if="meta.canRegisterAsGuest" #guest>
      <slot name="guest">
        <!-- Spacing lives on this wrapper: `Section` doesn't forward a passed
             class to a margin-bearing element, so the per-template `root`
             spacing must sit on a plain element. -->
        <div :class="styles.session.guestCheckout.root">
          <Section
            :label="t('auth.guest_checkout_qn')"
            icon="clock-fast-forward"
          >
            <i18n-t
              keypath="auth.guest_checkout_description"
              tag="p"
              :class="styles.session.guestCheckout.sidebarText"
            >
              <template #action>
                <Link
                  @click="registerAsGuest"
                  color="inherit"
                  size="inherit"
                  :label="t('auth.guest_checkout_action')"
                  :disabled="meta.isRegisteringAsGuest"
                  data-testid="guest-checkout-cta"
                >
                  <template v-if="meta.isRegisteringAsGuest" #append>
                    <Spinner size="square" class="ms-1" />
                  </template>
                </Link>
              </template>
            </i18n-t>
          </Section>
        </div>
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
        :class="templateMeta.isSplit ? '' : styles.session.markdown"
        :model-value="registerTemplate.body"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
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
import {
  Link,
  Markdown,
  Skeleton,
  Spinner
} from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Hero from "../../components/hero/Hero.vue";
import Back from "./components/Back.vue";
import Loading from "../system/Loading.vue";
import Section from "../../components/section/Section.vue";
import Summary from "../basket/components/Summary.vue";

// --- templates
import SessionSplitTemplate from "./templates/SessionSplit.template.vue";
import SessionCanvasCardTemplate from "./templates/SessionCanvasCard.template.vue";
import SessionSurfaceBoxTemplate from "./templates/SessionSurfaceBox.template.vue";
import SessionLTRTemplate from "./templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./templates/SessionRTL.template.vue";
import SessionEnclosedTemplate from "./templates/SessionEnclosed.template.vue";

const supportedTemplates = {
  [SESSION_TEMPLATE.SPLIT]: SessionSplitTemplate,
  [SESSION_TEMPLATE.CANVAS_CARD]: SessionCanvasCardTemplate,
  [SESSION_TEMPLATE.SURFACE_BOX]: SessionSurfaceBoxTemplate,
  [SESSION_TEMPLATE.TWO_COLUMN_LTR]: SessionLTRTemplate,
  [SESSION_TEMPLATE.TWO_COLUMN_RTL]: SessionRTLTemplate,
  [SESSION_TEMPLATE.ENCLOSED]: SessionEnclosedTemplate
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

const styles = useStyles(
  ["session", "session.guestCheckout"],
  computed(() => ({
    template: template.value
  })),
  sessionConfig
);

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
