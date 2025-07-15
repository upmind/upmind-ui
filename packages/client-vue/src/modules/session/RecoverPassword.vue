<template>
  <Layout>
    <ContentSection class="mx-auto max-w-2xl">
      <Button
        type="reset"
        class="bg-base-background relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        :label="t('navigation.login')"
        @click.prevent="doReject"
      >
        <template #prepend>
          <Icon icon="arrow-left" size="2xs" />
        </template>
      </Button>
    </ContentSection>

    <ContentSection
      class="mx-auto max-w-2xl"
      :tagline="t('session.recover.tagline')"
    >
      <template #title>
        <SmartTitle i18n-key="session.recover.title" size="2xl" />
      </template>

      <Card class="pb-3 md:pb-3">
        <Auth
          class="rounded-box w-full max-w-5xl items-start"
          no-tabs
          no-header
          model-value="recover"
          @update:model-value="doUpdate"
          @resolve="doResolve"
        >
        </Auth>
      </Card>

      <template #footer>
        <i18n-t
          class="mt-0"
          keypath="auth.google_recaptcha.terms"
          tag="p"
          scope="global"
        >
          <template #[`privacyPolicy`]>
            <Link
              class="has-text-grey-light"
              href="https://policies.google.com/privacy"
              target="_blank"
              >{{ $t("auth.google_recaptcha.privacy_policy") }}</Link
            >
          </template>
          <template #[`termsOfService`]>
            <Link
              class="has-text-grey-light"
              href="https://policies.google.com/terms"
              target="_blank"
              >{{ $t("auth.google_recaptcha.terms_of_service") }}</Link
            >
          </template>
        </i18n-t>
      </template>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { ROUTE, useRoutingEngine } from "@upmind-automation/headless";

// --- components
import ContentSection from "../../components/content/ContentSection.vue";
import Auth from "./components/Auth.vue";
import { Card, Button, Icon, Link, Layout } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- types
import type { AuthProps } from "./components/types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext, navigateBack, navigate, isResolved } = useRoutingEngine();

await isResolved(ROUTE.SESSION_RECOVER_PASSWORD);

function doUpdate(value: AuthProps["modelValue"]) {
  if (value === "login") {
    navigate(ROUTE.SESSION_LOGIN);
  } else if (value === "register") {
    navigate(ROUTE.SESSION_REGISTER);
  } else if (value === "recover") {
    navigate(ROUTE.SESSION_RECOVER_PASSWORD);
  }
}

function doReject() {
  navigateBack();
}

function doResolve() {
  navigateNext();
}
</script>
