<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR" :currency="false">
    <template #navigation>
      <Link
        class="flex items-center gap-x-2"
        @click.prevent="doReject"
        icon="arrow-left"
        :label="t('action.back_to_basket')"
        size="lg"
      />
    </template>

    <template #content-header>
      <Header :title="t('auth.welcome_back')">
        <template #description>
          <i18n-t
            keypath="auth.please_login_to_continue"
            scope="global"
            tag="span"
          >
            <template #[`create_one_here`]>
              <Link
                :to="{ name: ROUTE.SESSION_REGISTER }"
                size="inherit"
                color="inherit"
                :label="t('auth.create_one_here')"
                class="font-normal"
              />
            </template>
          </i18n-t>
        </template>
      </Header>
    </template>

    <template #content>
      <Section title="Login" icon="user-03">
        <div>
          <Auth
            class="rounded-box w-full max-w-5xl items-start"
            no-tabs
            no-header
            model-value="login"
            @update:model-value="doUpdate"
            @resolve="doResolve"
          />
        </div>
      </Section>
    </template>

    <template #aside>
      <Section :title="t('text.summary')" aside icon="shopping-bag-02">
        <Summary :actions="false" />
      </Section>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine, useBrand, ROUTE } from "@upmind-automation/headless";

// --- components
import { Link } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import Auth from "./components/Auth.vue";
import Header from "../../components/content/Header.vue";
import Section from "../../components/content/LayoutSection.vue";
import Summary from "../basket/components/Summary.vue";

// --- types
import type { AuthProps } from "./components/types";
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext, navigateBack, navigate, isResolved } = useRoutingEngine();
const { uiCart } = useBrand();

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
