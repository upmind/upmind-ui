<template>
  <Layout :variant="uiCart?.layout">
    <template #navigation>
      <Button
        class="flex items-center gap-x-2"
        @click.prevent="doReject"
        variant="link"
        icon="arrow-left"
        :label="t('navigation.back')"
        size="lg"
      />
    </template>

    <template #default>
      <Section class="mx-auto max-w-2xl gap-9">
        <Header
          :badge="{
            label: t('session.register.badge'),
            icon: 'lock'
          }"
          :title="t('session.register.title')"
        >
          <template #description>
            <span class="font-normal"
              >{{ t("session.register.actions.text") }}&nbsp;</span
            >

            <Button
              :to="{ name: ROUTE.SESSION_LOGIN }"
              variant="link"
              size="xl"
              :label="t('session.register.actions.action')"
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
            class="text-emphasis-medium mt-0 text-center text-sm"
            keypath="auth.google_recaptcha.terms"
            tag="p"
            scope="global"
          >
            <template #[`privacyPolicy`]>
              <Button
                class="has-text-grey-light"
                href="https://policies.google.com/privacy"
                target="_blank"
                variant="link"
                >{{ $t("auth.google_recaptcha.privacy_policy") }}</Button
              >
            </template>
            <template #[`termsOfService`]>
              <Button
                class="has-text-grey-light"
                href="https://policies.google.com/terms"
                target="_blank"
                variant="link"
                >{{ $t("auth.google_recaptcha.terms_of_service") }}</Button
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
import { Button, Layout } from "@upmind-automation/upmind-ui";
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
