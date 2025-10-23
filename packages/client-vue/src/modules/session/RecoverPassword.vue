<template>
  <Layout :variant="layout">
    <template #navigation>
      <Link
        class="flex items-center gap-x-2"
        @click.prevent="doReject"
        icon="arrow-left"
        :label="t('action.back_to_login')"
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
          :title="t('text.forgot_your_password_qn')"
          :description="t('auth.forgot_password_help')"
        />

        <section>
          <Auth
            class="rounded-box w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="recover"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />
        </section>
      </Section>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- internal
import { ROUTE, useRoutingEngine } from "@upmind-automation/headless";

// --- components
import { Layout, Link } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Header from "../../components/content/Header.vue";
import Section from "../../components/content/LayoutSection.vue";

// --- types
import type { AuthProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext, navigateBack, navigate, isResolved, currentRoute } =
  useRoutingEngine();

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});
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
