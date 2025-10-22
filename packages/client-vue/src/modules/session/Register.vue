<template>
  <Layout :variant="uiCart?.layout">
    <template #navigation>
      <Link
        class="flex items-center gap-x-2"
        @click.prevent="doReject"
        icon="arrow-left"
        :label="t('action.back_to_basket')"
        size="lg"
      />
    </template>

    <template #default>
      <Section class="mx-auto max-w-2xl gap-9">
        <Header
          :badge="{
            label: t('text.fully_encrypted_title'),
            icon: 'lock-04'
          }"
          :title="t('action.create_an_account')"
        >
          <template #description>
            <span class="font-normal"
              >{{ t("auth.already_have_account_qn") }}&nbsp;</span
            >

            <Link
              :to="{ name: ROUTE.SESSION_LOGIN }"
              size="inherit"
              :label="t('action.log_in_here')"
            />
          </template>
        </Header>

        <section>
          <Auth
            class="rounded-box w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="register"
            @resolve="doResolve"
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
        </section>
      </Section>
    </template>
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
  useBrand,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import { Layout, Link } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Header from "../../components/content/Header.vue";
import Section from "../../components/content/LayoutSection.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext, navigateBack, navigate, isResolved } = useRoutingEngine();
const { meta } = useSession();
const { uiCart } = useBrand();

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
