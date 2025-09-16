<template>
  <Layout :variant="uiCart?.layout">
    <template #navigation>
      <Button
        class="flex items-center gap-x-2"
        @click.prevent="doReject"
        variant="link"
        icon="arrow-left"
        :label="t('navigation.login')"
        size="lg"
      />
    </template>

    <template #default>
      <Section class="mx-auto max-w-2xl gap-9">
        <Header
          :badge="{
            label: t('session.recover.badge'),
            icon: 'lock'
          }"
          :title="t('session.recover.title')"
          :description="t('session.recover.tagline')"
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

// --- internal
import { ROUTE, useRoutingEngine, useBrand } from "@upmind-automation/headless";

// --- components
import { Button, Layout } from "@upmind-automation/upmind-ui";
import Auth from "./components/Auth.vue";
import Header from "../../components/content/Header.vue";
import Section from "../../components/content/LayoutSection.vue";

// --- types
import type { AuthProps } from "./components/types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext, navigateBack, navigate, isResolved } = useRoutingEngine();
const { uiCart } = useBrand();

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
