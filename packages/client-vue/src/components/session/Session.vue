<template>
  <section class="session" :class="styles.session.root">
    <header :class="styles.session.header" v-if="!noHeader">
      <slot name="header" v-bind="{ meta, user }">
        <template v-if="!meta.isAuthenticated && meta.showRegisterForm">
          <span :class="styles.session.text">
            {{ $t("session.unauthenticated.header.register.text") }}
          </span>

          <h1 :class="styles.session.title">
            {{ $t("session.unauthenticated.header.register.title") }}
          </h1>
        </template>

        <template v-if="!meta.isAuthenticated && meta.showLoginForm">
          <span :class="styles.session.text">
            {{ $t("session.unauthenticated.header.login.text") }}
          </span>

          <h1 :class="styles.session.title">
            {{ $t("session.unauthenticated.header.login.title") }}
          </h1>
        </template>

        <template v-if="meta.isAuthenticated">
          <i18n-t
            :class="styles.session.text"
            keypath="session.authenticated.footer.text"
            tag="p"
          >
            <template #[`action`]>
              <uw-button
                variant="link"
                @click.prevent="logout"
                :label="$t('session.authenticated.footer.action')"
              />
            </template>
          </i18n-t>

          <i18n-t
            :class="styles.session.title"
            keypath="session.authenticated.header.title"
            tag="h3"
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

    <upm-auth
      v-if="!meta.isAuthenticated"
      :class="styles.session.content"
      :block-tabs="blockTabs"
      :stretch-tabs="stretchTabs"
      :no-tabs="noTabs"
      :model-value="show"
    >
    </upm-auth>

    <footer :class="styles.session.footer" v-if="noFooter || !!$slots.footer">
      <slot name="footer" v-bind="{ meta, user }"> </slot>
    </footer>
  </section>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmAuth from "./Auth.vue";

// --- custom elements
import { UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwButton);

// --- types
import type { PropType } from "vue";
import type { AuthProps } from "./types";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmSession",
  components: {
    UpmAuth,
  },
  props: {
    show: {
      type: String as PropType<AuthProps["form"]>,
      default: "register",
    },
    noHeader: {
      type: Boolean,
      default: false,
    },
    noFooter: {
      type: Boolean,
      default: false,
    },
    blockTabs: { type: Boolean, default: false },
    stretchTabs: { type: Boolean, default: false },
    noTabs: { type: Boolean, default: false },
  },

  setup(props, { slots }) {
    const styles = useStyles(["session"], props, config);

    return {
      ...useSession(),
      styles,
    };
  },
});

// ---
</script>
