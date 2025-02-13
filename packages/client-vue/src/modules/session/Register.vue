<template>
  <article>
    <UpmContentSection class="mx-auto max-w-2xl">
      <Button
        type="reset"
        class="relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        :label="t('navigation.back')"
        @click.prevent="doReject"
      >
        <template #prepend>
          <Icon icon="arrow-left" size="2xs" />
        </template>
      </Button>
    </UpmContentSection>

    <UpmContentSection class="mx-auto max-w-2xl">
      <template #title>
        <i18n-t
          keypath="session.unauthenticated.register.title"
          tag="span"
          for="session.unauthenticated.register.account"
          class="text-primary font-bold"
        >
          <mask class="bg-accent leading-relaxed">{{
            t("session.unauthenticated.register.account")
          }}</mask>
        </i18n-t>
      </template>

      <UpmCard class="pb-3 md:pb-3">
        <Auth
          class="rounded-box w-full max-w-5xl items-start"
          no-tabs
          no-header
          model-value="register"
          @update:model-value="doLogin"
          @resolve="doResolve"
        >
        </Auth>
      </UpmCard>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine, ROUTE } from "@upmind-automation/client-vue";

// --- components
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";
import { Button, Icon } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
// --- types
import type { AuthProps } from "./components/types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { next, back, navigate } = useRoutingEngine();

function doLogin(value: AuthProps["modelValue"]) {
  if (value === "login") {
    navigate(ROUTE.SESSION_LOGIN);
  }
}

function doReject() {
  back();
}

function doResolve() {
  // const redirectPath = route.query.redirect || "/";
  // router.push(redirectPath);
  next();
}
</script>
