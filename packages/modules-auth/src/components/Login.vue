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

    <template #form="{ card = false, active = true }">
      <slot name="form">
        <Section
          :card="card"
          :label="t('action.login')"
          value="log-in"
          icon="user-03"
          v-show="!isAuthenticated"
          :class="sessionFormWidthVariants({ card })"
          :active="active"
        >
          <template v-if="card" #actions>
            <Link
              color="muted"
              size="sm"
              @click.prevent="doUpdate('register')"
              >{{ t("action.create_account") }}</Link
            >
          </template>

          <Markdown
            v-if="active && loginTemplate?.body"
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
      <slot name="summary" v-bind="summarySlot" />
    </template>

    <template v-if="loginTemplate?.body" #markdown="{ flush = false }">
      <Markdown
        tag="section"
        :class="markdownVariants({ flush })"
        :model-value="loginTemplate.body"
      />
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { Link, Markdown, type LinkVariants } from "@upmind/ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import { Section } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import {
  useRoutingEngine,
  useActiveSession,
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import {
  useConfig,
  useClientTemplate,
  useBrand
} from "@upmind-automation/headless";
import { markdownVariants, sessionFormWidthVariants } from "../variants";
import Auth from "./Auth.vue";
import AuthLoading from "./AuthLoading.vue";
import type {
  AuthProps,
  AuthSummarySlotProps,
  AuthViewEmits,
  AuthViewProps
} from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<AuthViewProps>();
const emit = defineEmits<AuthViewEmits>();
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isAuthenticated } = useActiveSession().useMeta();
const { isReady } = useActiveSession().useActions();
const {
  navigateNext,
  navigateBack,
  navigate,
  meta: routingMeta
} = useRoutingEngine();

const { ui } = useConfig({
  // The key must be present to opt out, or useConfig fetches the basket on every auth page.
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

const isResolving = ref(false);

const summarySlot: AuthSummarySlotProps = { showWhileLoading: false };

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
