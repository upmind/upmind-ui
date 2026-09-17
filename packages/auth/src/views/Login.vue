<template>
  <component :is="loading" v-if="isResolving" />
  <component :is="templateVariant" v-bind="props" v-else>
    <template #back>
      <slot name="back">
        <!-- One-page uses the compact "← Back" per the designs; other templates
             keep the default "Back to basket". -->
        <Back
          v-if="resolveMeta.hasReject"
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
        <component :is="summaryComponent" v-if="summaryComponent" />
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
import { Link, Markdown } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import {
  Section,
  useShellComponents,
  useThemeEngine
} from "@upmind-automation/foundation";
import {
  useRoutingEngine,
  useActiveSession,
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import {
  useConfig,
  validateTemplate,
  useClientTemplate,
  useBrand
} from "@upmind-automation/headless";
import { useAuthResolve, useAuthTemplates } from "../auth.utils";
import Auth from "../components/Auth.vue";
import { AUTH_SHELL, AUTH_TEMPLATE_SLOT, useAuthLoading } from "../shell";
import AuthBareTemplate from "../templates/AuthBare.template.vue";
import { type AuthProps, type AuthViewProps, AUTH_TEMPLATE } from "../types";
import { markdownVariants, sessionFormWidthVariants } from "../variants";

// -----------------------------------------------------------------------------

const props = defineProps<AuthViewProps>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const themeEngine = useThemeEngine();

const { isAuthenticated } = useActiveSession().useMeta();
const { isReady } = useActiveSession().useActions();
const { navigate } = useRoutingEngine();
const {
  meta: resolveMeta,
  navigateRejected,
  navigateResolved
} = useAuthResolve(props);

const { ui } = useConfig({
  // The key must be PRESENT to opt out: useConfig calls useBasket() unless it
  // is, which fetched an order and the basket-fields catalogue on every auth
  // page. No ui.* definition resolves from the basket, so nothing is lost.
  basket: undefined,
  context: UIContext.AUTH,
  provide: true
});
const { brandId } = useBrand();
const { data: loginTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.LOGIN_PAGE,
  objectId: brandId.value
});

await isReady();

themeEngine.set(ui.theme.value);

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

const shell = useShellComponents();

const templateVariant = computed(
  () => shell.resolve(AUTH_TEMPLATE_SLOT[template.value]) ?? AuthBareTemplate
);

const summaryComponent = computed(() => shell.resolve(AUTH_SHELL.SUMMARY));
const { component: loading } = useAuthLoading();
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
  isResolving.value = true;
  navigateRejected().catch(() => {
    isResolving.value = false;
  });
}

function doResolve() {
  if (!resolveMeta.value.hasResolve) return;
  isResolving.value = true;
  navigateResolved().catch(() => {
    isResolving.value = false;
  });
}
</script>
