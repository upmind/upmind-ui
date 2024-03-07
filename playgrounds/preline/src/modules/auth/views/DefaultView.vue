<template>
  <div class="px-8 py-1">
    <h2 class="mb-1 text-2xl font-semibold tracking-tight group text-inherit">
      Default login page
      <a
        href="#default-login-page"
        class="ml-3 text-primary font-style-italic transition ease-out duration-100 opacity-0 group-hover:opacity-100"
      >
        #
      </a>
    </h2>
    <p class="text-lg lg:mb-0 lg:max-w-2xl">
      This example includes a form with an email and password input accompanied
      by the logo and other helper texts and links to other authentication
      pages.
    </p>
  </div>

  <!-- <upm-auth
    v-if="!meta.isAuthenticated"
    class="my-8 rounded-box"
    :data-theme="activeTheme"
  ></upm-auth>

  <upm-profile
    v-else
    class="my-8 rounded-box"
    :data-theme="activeTheme"
  ></upm-profile> -->
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useSession } from "@upmind/vue";
import { UpmDebug } from "@upmind/ui";

import UpmAuth from "../components/Auth.vue";
import UpmProfile from "../components/Profile.vue";

const activeTheme = inject("activeTheme");

const {
  state,
  context,
  errors,
  meta,
  // ---
  client,
  guest,
  // ---
  logout,
  reject,
} = useSession();

// ---
</script>
