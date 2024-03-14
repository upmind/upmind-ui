<template>
  <section class="session w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
    >
      <div class="flex-1">
        <h2 class="title m-0">
          Session

          <span v-if="meta.isAuthenticated">
            is a <span class="text-primary">Client</span>
          </span>

          <span v-else-if="meta.isClient">
            is <span class="text-primary">Authenticating...</span>
          </span>

          <span v-else> is a <span class="text-primary">Guest</span> </span>
        </h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions">
          <!-- <button @click="getUser" v-if="meta.isAuthenticated">get user</button> -->
          <button
            class="btn btn-ghost join-item"
            type="reset"
            @click="logout"
            v-if="meta.isAuthenticated"
          >
            logout
          </button>
          <button
            class="btn btn-ghost join-item"
            type="reset"
            @click.prevent="reject"
            v-if="client"
          >
            cancel
          </button>
        </slot>
      </div>
    </header>

    <upm-auth
      v-if="!meta.isAuthenticated"
      class="my-8 rounded-box"
      :data-theme="activeTheme"
    ></upm-auth>

    <upm-profile
      v-else
      class="my-8 rounded-box"
      :data-theme="activeTheme"
    ></upm-profile>

    <footer>
      <upm-debug
        title="Session"
        :open="{ state }"
        :state="{ session: state, guest: guest?.value, client: client?.value }"
        :context="context"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
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
