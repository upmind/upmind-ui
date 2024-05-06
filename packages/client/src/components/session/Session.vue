<template>
  <section class="session" :class="styles.session.root">
    <header :class="styles.session.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <upm-auth
      v-if="!meta.isAuthenticated"
      :class="styles.session.content"
      :show="show"
    />

    <upm-profile v-else :class="styles.session.content" />

    <footer :class="styles.session.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
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
import UpmProfile from "./Profile.vue";

// --- types
import type { PropType } from "vue";
import type { SessionProps } from "./types";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmSession",
  components: {
    UpmAuth,
    UpmProfile,
  },
  props: {
    show: {
      type: String as PropType<SessionProps["show"]>,
      default: "login",
    },
  },
  setup(props) {
    const styles = useStyles(
      ["session", "sessionTransitionEnter", "sessionTransitionLeave"],
      props,
      config
    );

    return {
      ...useSession(),
      styles,
    };
  },
});

// ---
</script>
