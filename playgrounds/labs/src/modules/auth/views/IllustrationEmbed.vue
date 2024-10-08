<template>
  <div
    class="mx-auto flex h-full w-full flex-wrap bg-gradient-to-br from-base to-neutral-200 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="w-full md:grid md:grid-cols-3 md:items-center md:gap-8 lg:grid-cols-2 xl:gap-12"
    >
      <div class="relative h-1/4 w-full sm:h-full md:order-last">
        <img
          class="m-0 h-full w-full object-contain p-8"
          :src="`/illustration-${activeTheme}.svg`"
          alt="Illustration of a person entering a password"
        />
      </div>

      <div class="px-4 py-8 sm:px-6 md:col-span-2 lg:col-auto lg:px-8">
        <Spinner
          class="w-full justify-center text-center"
          v-if="meta.isProcessing"
        />

        <div
          v-else-if="meta.showLoginForm || meta.showRegisterForm"
          class="rounded-xl border bg-base-50 p-4 text-base-content shadow-lg sm:p-7"
        >
          <div class="text-center">
            <h3 class="block text-2xl font-bold text-inherit">
              Sign {{ meta.showLoginForm ? "in" : "up" }}
            </h3>

            <p v-if="meta.showLoginForm" class="mt-2 text-sm text-base-content">
              Don't have an account yet?
              <button
                class="font-medium text-primary decoration-2 hover:underline"
                @click.prevent="showRegister"
              >
                Sign up here
              </button>
            </p>

            <p
              v-if="meta.showRegisterForm"
              class="mt-2 text-sm text-base-content"
            >
              Already have an account?
              <button
                class="font-medium text-secondary decoration-2 hover:underline"
                @click.prevent="showLogin"
              >
                Sign in here
              </button>
            </p>
          </div>

          <div
            class="my-5 flex items-center py-3 text-xs uppercase text-base-400 before:me-6 before:flex-[1_1_0%] before:border-t before:border-base-400 after:ms-6 after:flex-[1_1_0%] after:border-t after:border-base-400"
          >
            Or
          </div>

          <upm-auth-form v-if="!meta.isAuthenticated" class="gap-y-8" />
        </div>

        <upm-profile></upm-profile>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, watch } from "vue";

import { useSession } from "@upmind/headless-vue";
import UpmAuthForm from "../components/Form.vue";
import UpmProfile from "../components/Profile.vue";
import { Spinner } from "@upmind/upwind";
// ---
const { activeTheme } = inject("upwind");

// ---
// lets set up an inspector on the session
const { meta, showLogin, showRegister } = useSession(message =>
  window?.top?.postMessage(message, "*")
);

// Lets automatically show the login form and not wait for the user to click the login button
if (!meta.isAuthenticated) showLogin();

watch(meta, ({ canShowForms }) => {
  if (canShowForms) {
    showLogin();
  }
});
</script>
