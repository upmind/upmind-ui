<template>
  <component :is="templateVariant" v-bind="props" v-if="!isResolving">
    <template #back>
      <slot name="back">
        <!-- One-page uses the compact "← Back" per the designs; other templates
             keep the default "Back to login". -->
        <Back
          :label="meta.isInset ? t('action.back') : t('action.back_to_login')"
          :icon="meta.isInset ? 'arrow-narrow-left' : 'arrow-left'"
          size="md"
          :color="meta.isInset ? 'muted' : 'default'"
          @click.prevent="doReject"
        />
      </slot>
    </template>

    <template #hero>
      <slot name="hero">
        <Hero :title="t('text.forgot_your_password_qn')">
          <template #subtitle>
            <i18n-t
              keypath="auth.forgot_password_help"
              scope="global"
              tag="span"
            >
              <template #[`log_in_here`]>
                <Link
                  :to="props.loginRoute"
                  size="inherit"
                  color="inherit"
                  class="font-normal"
                  >{{ t("action.log_in_here") }}</Link
                >
              </template>
            </i18n-t>
          </template>
        </Hero>
      </slot>
    </template>

    <template #form>
      <slot name="form">
        <!-- One-page renders the form as a titled card; other templates keep the
             plain section. The Back button already returns to login, so no header
             cross-link is needed either way. -->
        <Section
          :card="meta.isInset"
          :label="t('action.recover_password')"
          icon="user-03"
          v-show="!isAuthenticated"
          :class="sessionFormWidthVariants({ inset: meta.isInset })"
        >
          <Auth
            class="rounded-card w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="recover"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />
        </Section>
      </slot>
    </template>

    <template #summary>
      <slot name="summary">
        <Section
          v-if="basketMeta.hasProducts && summaryComponent"
          :label="t('cart.basket_section')"
          icon="shopping-bag-02"
        >
          <component :is="summaryComponent" />
        </Section>
      </slot>
    </template>
  </component>
</template>

<script lang="ts" setup>
import { Link } from "@upmind/ui";
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
  useBasket,
  useRoutingEngine,
  useActiveSession,
  UIContext
} from "@upmind-automation/headless";
import { useConfig, validateTemplate } from "@upmind-automation/headless";
import Auth from "./components/Auth.vue";
import { AUTH_SHELL, AUTH_TEMPLATE_SLOT } from "./shell";
import AuthBareTemplate from "./templates/AuthBare.template.vue";
import {
  type SessionProps,
  type SessionRoutes,
  SESSION_TEMPLATE
} from "./types";
import { sessionFormWidthVariants } from "./variants";

// -----------------------------------------------------------------------------

const props = defineProps<
  SessionRoutes & {
    template?: SESSION_TEMPLATE;
  }
>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const themeEngine = useThemeEngine();

const { isAuthenticated } = useActiveSession().useMeta();
const { isReady } = useActiveSession().useActions();
const { meta: basketMeta } = useBasket();
const { navigateNext, navigateBack, navigate } = useRoutingEngine();

const { ui } = useConfig({
  context: UIContext.AUTH,
  provide: true
});

await isReady();

themeEngine.set(ui.theme.value);

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

const shell = useShellComponents();

const templateVariant = computed(
  () => shell.resolve(AUTH_TEMPLATE_SLOT[template.value]) ?? AuthBareTemplate
);

const summaryComponent = computed(() => shell.resolve(AUTH_SHELL.SUMMARY));

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
