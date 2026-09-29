<template>
  <slot v-if="isResolving" name="loading"><AuthLoading /></slot>
  <component :is="templateVariant" v-bind="templateProps" v-else>
    <template #back>
      <slot name="back">
        <!-- One-page uses the compact "← Back" per the designs; other templates
             keep the default "Back to basket". -->
        <Back
          v-if="routingMeta.hasFunnels"
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

          <slot name="guest-checkout" v-bind="guestCheckoutSlot" />

          <Account
            v-if="isGuestClient"
            v-show="!isLoading"
            class="rounded-card w-full max-w-5xl items-start"
            @resolve="doResolve"
          />

          <Auth
            v-show="!isLoading"
            class="rounded-card w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="register"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />

          <div v-if="isLoading" class="flex w-full max-w-5xl flex-col gap-6">
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
                href="https://policies.google.com/privacy"
                target="_blank"
                size="inherit"
                color="inherit"
                >{{ t("text.privacy_policy") }}</Link
              >
            </template>
            <template #[`termsOfService`]>
              <Link
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
      <slot name="summary" v-bind="summarySlot" />
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
import { Link, Markdown } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import { Section } from "@upmind-automation/foundation";
import {
  useRoutingEngine,
  useActiveSession,
  useAuth,
  ScopeActorTypes,
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import {
  useConfig,
  validateTemplate,
  useClientTemplate,
  useBrand
} from "@upmind-automation/headless";
import { useAuthTemplates } from "./auth.utils";
import Account from "./components/Account.vue";
import Auth from "./components/Auth.vue";
import AuthLoading from "./components/AuthLoading.vue";
import { useAuthTemplate } from "./shell";
import {
  type AuthGuestCheckoutSlotProps,
  type AuthProps,
  type AuthSummarySlotProps,
  type AuthViewEmits,
  type AuthViewProps,
  AUTH_TEMPLATE
} from "./types";
import {
  guestCheckoutVariants,
  markdownVariants,
  sessionFormWidthVariants,
  sessionSubtitleVariants
} from "./variants";
import { omit } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<AuthViewProps>();
const emit = defineEmits<AuthViewEmits>();
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isAuthenticated, isLoading, isGuestClient } =
  useActiveSession().useMeta();
const { isReady } = useActiveSession().useActions();

const auth = useAuth().as(ScopeActorTypes.CLIENT);
const { isRegisteringAsGuest } = auth.useMeta();
const authActions = auth.useActions();
function registerAsGuest() {
  if ("registerAsGuest" in authActions)
    return authActions?.registerAsGuest().then(() => doResolve());
}
const {
  navigateNext,
  navigateBack,
  navigate,
  meta: routingMeta
} = useRoutingEngine();
const { brandId } = useBrand();

const { ui } = useConfig({
  // The key must be present to opt out, or useConfig fetches the basket on every auth page.
  basket: undefined,
  context: UIContext.AUTH,
  provide: true
});
const { data: registerTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.REGISTER_PAGE,
  objectId: brandId.value
});

await isReady();

const isResolving = ref(false);

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    AUTH_TEMPLATE,
    AUTH_TEMPLATE.TWO_COLUMN_LTR
  )
);

const meta = computed(() => ({
  isInset: template.value === AUTH_TEMPLATE.INSET
}));

const { component: templateVariant } = useAuthTemplate(
  () => template.value,
  () => props.templates
);
const templateProps = computed(() => omit(props, ["templates"]));

const summarySlot: AuthSummarySlotProps = { showWhileLoading: true };
const guestCheckoutSlot = computed<AuthGuestCheckoutSlotProps>(() => ({
  registerAsGuest,
  isRegistering: isRegisteringAsGuest.value,
  class: guestCheckoutVariants({ template: template.value })
}));
const { meta: templateMeta } = useAuthTemplates(template);

function doUpdate(value: AuthProps["modelValue"]) {
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
  if (routingMeta.value.hasFunnels) {
    isResolving.value = true;
    navigateBack().catch(() => {
      isResolving.value = false;
    });
  } else {
    emit("reject");
  }
}

function doResolve() {
  if (isResolving.value) return;
  if (routingMeta.value.hasFunnels) {
    isResolving.value = true;
    navigateNext().catch(() => {
      isResolving.value = false;
    });
  } else {
    emit("resolve");
  }
}
</script>
