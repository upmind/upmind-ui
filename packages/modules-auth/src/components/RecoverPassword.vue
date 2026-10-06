<template>
  <LayoutProvider v-if="!isResolving">
    <slot :template="ui.template.value" />

    <template #back="{ compact = false }">
      <slot name="back">
        <Back v-bind="backLink(compact)" size="md" @click.prevent="doReject" />
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

    <template #form="{ card = false }">
      <slot name="form">
        <!-- The Back button already returns to login, so no header cross-link
             is needed, carded or not. -->
        <Section
          :card="card"
          :label="t('action.recover_password')"
          icon="user-03"
          v-show="!isAuthenticated"
          :class="sessionFormWidthVariants({ card })"
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
      <slot name="summary" v-bind="summarySlot" />
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { Link, type LinkVariants } from "@upmind/ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Back } from "@upmind-automation/foundation";
import { Section } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import {
  useRoutingEngine,
  useActiveSession,
  UIContext
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { sessionFormWidthVariants } from "../variants";
import Auth from "./Auth.vue";
import type {
  AuthProps,
  AuthRecoverViewProps,
  AuthSummarySlotProps,
  AuthViewEmits
} from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<AuthRecoverViewProps>();
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

await isReady();

const isResolving = ref(false);

const summarySlot: AuthSummarySlotProps = { showWhileLoading: false };

function backLink(compact: boolean): {
  label: string;
  icon: string;
  color: LinkVariants["color"];
} {
  if (compact)
    return {
      label: t("action.back"),
      icon: "arrow-narrow-left",
      color: "muted"
    };
  return {
    label: t("action.back_to_login"),
    icon: "arrow-left",
    color: "default"
  };
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
