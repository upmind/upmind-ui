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
        <SmartTitle i18n-key="session.login.title" size="2xl" />
      </template>

      <p class="mt-0">
        <span class="font-normal"
          >{{ t("session.login.actions.text") }}&nbsp;</span
        >

        <Link :to="{ name: ROUTE.SESSION_REGISTER }">
          {{ t("session.login.actions.action") }}
        </Link>
      </p>

      <Card class="mt-4 pb-3 md:pb-3">
        <Auth
          class="rounded-box w-full max-w-5xl items-start"
          no-tabs
          no-header
          model-value="login"
          @update:model-value="doUpdate"
          @resolve="doResolve"
        >
        </Auth>
      </Card>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine, ROUTE } from "@upmind-automation/headless";

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

await isResolved(ROUTE.SESSION_LOGIN);

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
  // const redirectPath = route.query.redirect || "/";
  // router.push(redirectPath);
  navigateNext();
}
</script>
