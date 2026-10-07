<template>
  <slot v-if="isResolving" name="loading"><AuthLoading /></slot>
  <LayoutProvider v-else>
    <slot :template="ui.template.value" />

    <template #back="{ compact = false }">
      <slot name="back">
        <Back
          v-if="routingMeta.hasFunnels"
          v-bind="backLink(compact)"
          size="md"
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

    <template
      #form="{
        card = false,
        active = true,
        guestSpacing = GUEST_CHECKOUT_SPACING.FLUSH
      }"
    >
      <slot name="form">
        <!-- One register form for new sign-ups AND guest-client upgrades; Auth
             picks the right form from the session machine (a guest client's
             upgrade form is owned by the client machine). Shown unless the user
             is a fully-registered client. A carded form is titled "Create
             Account" with a "Log in" cross-link. -->
        <Section
          :card="card"
          :label="t(card ? 'action.create_account' : 'action.register')"
          icon="user-03"
          :class="sessionFormWidthVariants({ card })"
          v-show="!isAuthenticated || isGuestClient"
          :active="active"
        >
          <template v-if="card && !isGuestClient" #actions>
            <Link color="muted" size="sm" @click.prevent="doUpdate('login')">{{
              t("action.login")
            }}</Link>
          </template>

          <Markdown
            v-if="active && registerTemplate?.body"
            tag="div"
            :model-value="registerTemplate.body"
          />

          <slot
            name="guest-checkout"
            v-bind="guestCheckoutSlot"
            :class="guestCheckoutVariants({ spacing: guestSpacing })"
          />

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

    <template v-if="registerTemplate?.body" #markdown="{ flush = false }">
      <Markdown
        tag="div"
        :class="markdownVariants({ flush })"
        :model-value="registerTemplate.body"
      />
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { Link, Markdown, type LinkVariants } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import { Section } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
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
  useClientTemplate,
  useBrand
} from "@upmind-automation/headless";
import {
  type AuthGuestCheckoutSlotProps,
  type AuthProps,
  type AuthSummarySlotProps,
  type AuthViewEmits,
  type AuthViewProps,
  GUEST_CHECKOUT_SPACING
} from "../types";
import {
  guestCheckoutVariants,
  markdownVariants,
  sessionFormWidthVariants,
  sessionSubtitleVariants
} from "../variants";
import Account from "./Account.vue";
import Auth from "./Auth.vue";
import AuthLoading from "./AuthLoading.vue";

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

const summarySlot: AuthSummarySlotProps = { showWhileLoading: true };
const guestCheckoutSlot = computed<AuthGuestCheckoutSlotProps>(() => ({
  registerAsGuest,
  isRegistering: isRegisteringAsGuest.value
}));

function backLink(compact: boolean): {
  label: string;
  icon?: string;
  color: LinkVariants["color"];
} {
  if (compact)
    return {
      label: t("action.back"),
      icon: "arrow-narrow-left",
      color: "muted"
    };
  return { label: t("action.back_to_basket"), color: "default" };
}

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
