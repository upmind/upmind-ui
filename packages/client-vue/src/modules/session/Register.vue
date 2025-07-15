<template>
  <Layout>
    <template #navigation>
      <Link class="flex items-center gap-x-2" @click.prevent="doReject">
        <Icon icon="arrow-left" size="2xs" />
        {{ t("navigation.back") }}
      </Link>
    </template>

    <ContentSection class="mx-auto max-w-2xl">
      <template #title>
        <SmartTitle i18n-key="session.register.title" size="2xl" />
      </template>

      <p class="mt-0">
        <span class="font-normal"
          >{{ t("session.register.actions.text") }}&nbsp;</span
        >

        <Link :to="{ name: ROUTE.SESSION_LOGIN }">
          {{ t("session.register.actions.action") }}
        </Link>
      </p>

      <Card class="mt-4 pb-3 md:pb-3">
        <Auth
          class="rounded-box w-full max-w-5xl items-start"
          no-tabs
          no-header
          model-value="register"
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
import { watch } from "vue";
// --- internal
import {
  useRoutingEngine,
  useSession,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import { Card, Button, Icon, Link, Layout } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext, navigateBack, navigate, isResolved } = useRoutingEngine();
const { meta } = useSession();

await isResolved(ROUTE.SESSION_REGISTER);

function doReject() {
  navigateBack();
}

function doResolve() {
  // const redirectPath = route.query.redirect || "/";
  // router.push(redirectPath);
  navigateNext();
}

watch(meta, (newVal, oldVal) => {
  if (oldVal.showRegisterForm && newVal.showLoginForm) {
    navigate(ROUTE.SESSION_LOGIN);
  }
});
</script>
