<template>
  <div class="relative mx-auto flex w-full flex-wrap" :data-theme="activeTheme">
    <figure class="z-index-0 absolute h-full w-full bg-neutral">
      <img
        class="m-0 h-full w-full object-cover opacity-40"
        src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/authentication/background.jpg"
        alt="Illustration of a person entering a password"
      />
    </figure>

    <div
      class="z-index-1 relative mx-4 flex h-screen max-h-full w-full items-center justify-center overflow-auto md:mx-8 xl:mx-12"
    >
      <upm-spinner
        class="w-full justify-center text-center"
        v-if="meta.isProcessing"
      />

      <div
        v-else-if="meta.showLoginForm || meta.showRegisterForm"
        class="w-full max-w-md rounded-xl border border-base-300 bg-base-50 p-4 px-4 py-8 text-base-content shadow-sm sm:p-7 sm:px-6 lg:px-8"
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
</template>

<script setup>
import { inject, watch } from "vue";

import { useSession } from "@upmind/vue";
import UpmAuthForm from "../components/Form.vue";
import UpmProfile from "../components/Profile.vue";
import UpmSpinner from "../../../components/Spinner.vue";
// ---
const activeTheme = inject("activeTheme");

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
