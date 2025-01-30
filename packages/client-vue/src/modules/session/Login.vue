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
          keypath="session.unauthenticated.login.title"
          tag="span"
          for="session.unauthenticated.login.account"
          class="font-bold text-primary"
        >
          <mask class="bg-accent leading-relaxed">{{
            t("session.unauthenticated.login.account")
          }}</mask>
        </i18n-t>
      </template>

      <UpmCard class="pb-3 md:pb-3">
        <UpmAuth
          class="w-full max-w-5xl items-start rounded-box"
          no-tabs
          no-header
          model-value="login"
          @update:model-value="doRegister"
          @resolve="doResolve"
        >
        </UpmAuth>
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

import {
  UpmCard,
  UpmContentSection,
  UpmAuth,
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";

// --- types
import type { AuthProps } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { next, back, navigate } = useRoutingEngine();

function doRegister(value: AuthProps["modelValue"]) {
  if (value === "register") {
    navigate(ROUTE.SESSION_REGISTER);
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
