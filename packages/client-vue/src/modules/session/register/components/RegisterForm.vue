<template>
  <div>
    <Auth
      class="rounded-box w-full max-w-5xl items-start"
      no-tabs
      no-header
      model-value="register"
      @resolve="handleResolve"
    />

    <i18n-t
      class="text-muted text-sm"
      keypath="auth.recaptcha_terms_desc"
      tag="p"
      scope="global"
    >
      <template #[`privacyPolicy`]>
        <Link
          class="has-text-grey-light"
          href="https://policies.google.com/privacy"
          target="_blank"
          size="inherit"
          color="inherit"
          >{{ $t("text.privacy_policy") }}</Link
        >
      </template>
      <template #[`termsOfService`]>
        <Link
          class="has-text-grey-light"
          href="https://policies.google.com/terms"
          target="_blank"
          size="inherit"
          color="inherit"
          >{{ $t("text.terms_of_service") }}</Link
        >
      </template>
    </i18n-t>
  </div>
</template>

<script lang="ts" setup>
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  useRoutingEngine,
  useSession,
  ROUTE
} from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";
import Auth from "../../components/Auth.vue";

const { t } = useI18n();
const { navigateNext, navigate, isResolved } = useRoutingEngine();
const { meta } = useSession();

await isResolved(ROUTE.SESSION_REGISTER);

function handleResolve() {
  navigateNext();
}

watch(meta, (newVal, oldVal) => {
  if (oldVal.showRegisterForm && newVal.showLoginForm) {
    navigate(ROUTE.SESSION_LOGIN);
  }
});
</script>
