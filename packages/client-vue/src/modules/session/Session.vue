<template>
  <section class="session" :class="styles.session.root">
    <header :class="styles.session.header" v-if="!noHeader || !!$slots.header">
      <slot name="header" v-bind="{ meta, user }">
        <template v-if="!meta.isAuthenticated && meta.showRegisterForm">
          <span :class="styles.session.text">
            {{ t("session.header.register.text") }}
          </span>

          <h1 :class="styles.session.title">
            {{ t("session.header.register.title") }}
          </h1>
        </template>

        <template v-if="!meta.isAuthenticated && meta.showLoginForm">
          <span :class="styles.session.text">
            {{ t("session.header.login.text") }}
          </span>

          <h1 :class="styles.session.title">
            {{ t("session.header.login.title") }}
          </h1>
        </template>

        <template v-if="meta.isAuthenticated">
          <i18n-t
            :class="styles.session.text"
            keypath="session.authenticated.footer.text"
            tag="p"
            scope="global"
          >
            <template #[`action`]>
              <Button
                variant="link"
                @click.prevent="logout"
                :label="t('session.authenticated.footer.action')"
              />
            </template>
          </i18n-t>

          <i18n-t
            :class="styles.session.title"
            keypath="session.authenticated.header.title"
            tag="h3"
            scope="global"
          >
            <template #[`name`]>
              <strong :class="styles.session.name">
                {{ user?.display }}
              </strong>
            </template>
          </i18n-t>
        </template>
      </slot>
    </header>

    <Auth
      v-if="!meta.isAuthenticated"
      :class="styles.session.content"
      :block-tabs="blockTabs"
      :stretch-tabs="stretchTabs"
      :no-tabs="noTabs"
      :color="color"
      :model-value="modelValue"
    >
    </Auth>

    <footer :class="styles.session.footer" v-if="!noFooter || !!$slots.footer">
      <slot name="footer" v-bind="{ meta, user }"> </slot>
    </footer>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./components/session.config";

// --- components
import Auth from "./components/AuthTabs.vue";

// --- custom elements
import { Button } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { AuthProps } from "./components/types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<AuthProps>(), {
  modelValue: "register",
});

const { t } = useI18n();
const styles = useStyles(["session"], props, config) as ComputedRef<{
  session: {
    root: string;
    header: string;
    content: string;
    footer: string;
    text: string;
    title: string;
    name: string;
  };
}>;
const { meta, user, logout } = useSession();

// ---
</script>
