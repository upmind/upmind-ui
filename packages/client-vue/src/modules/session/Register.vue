<template>
  <article>
    <ContentSection class="mx-auto max-w-2xl">
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
    </ContentSection>

    <ContentSection class="mx-auto max-w-2xl">
      <template #title>
        <SmartTitle
          i18n-key="session.unauthenticated.register.title"
          size="2xl"
        />
      </template>

      <Card class="pb-3 md:pb-3">
        <Auth
          class="rounded-box w-full max-w-5xl items-start"
          no-tabs
          no-header
          model-value="register"
          @update:model-value="doLogin"
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
import { useRoutingEngine, ROUTE } from "@upmind-automation/headless-vue";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import Card from "../../components/content/Card.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- types
import type { AuthProps } from "./components/types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { next, back, navigate, isResolved } = useRoutingEngine();

await isResolved(ROUTE.SESSION_REGISTER).catch(back);

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
