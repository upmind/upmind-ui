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
          :title="tm('session.unauthenticated.login.title')"
          size="2xl"
        />
      </template>

      <Card class="pb-3 md:pb-3">
        <Auth
          class="rounded-box w-full max-w-5xl items-start"
          no-tabs
          no-header
          model-value="login"
          @update:model-value="doRegister"
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
import Card from "../../components/content/Card.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import Auth from "./components/Auth.vue";
import { Button, Icon } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
// --- types
import type { AuthProps } from "./components/types";

// -----------------------------------------------------------------------------

const { t, tm } = useI18n();
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
