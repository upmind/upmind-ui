<template>
  <article>
    <ContentSection class="mx-auto max-w-2xl">
      <Button
        type="reset"
        class="relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        :label="t('navigation.navigateBack')"
        @click.prevent="doReject"
      >
        <template #prepend>
          <Icon icon="arrow-left" size="2xs" />
        </template>
      </Button>
    </ContentSection>

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

      <Card class="pb-3 md:pb-3">
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
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine, ROUTE } from "@upmind-automation/headless";

// --- components
import Card from "../../components/content/Card.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import Auth from "./components/Auth.vue";
import { Button, Icon, Link } from "@upmind-automation/upmind-ui";
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
