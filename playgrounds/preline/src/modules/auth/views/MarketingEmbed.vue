<template>
  <div
    class="mx-auto flex h-full w-full flex-wrap border bg-base-50 text-base-content lg:border-none"
    :data-theme="activeTheme"
  >
    <div class="w-full lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
      <div
        class="flex flex-wrap content-center bg-gradient-to-tr from-primary to-secondary px-6 py-12 text-neutral-content sm:px-6 lg:order-last lg:px-8"
      >
        <h1
          class="block max-w-lg text-3xl font-bold text-inherit sm:text-4xl lg:text-6xl lg:leading-tight"
        >
          Start your journey with <span class="text-neutral">Upmind</span>
        </h1>
        <p class="mt-3 max-w-lg text-lg">
          Entrepreneurs from around the world showcase and sell their services
          on Upmind - the home to the world’s best billing, sales and automation
          platform for service businesses.
        </p>

        <!-- End Buttons -->
      </div>

      <div
        class="col-span-1 mx-4 self-center px-4 py-8 sm:mx-6 sm:px-6 lg:mx-8 lg:px-8"
      >
        <upm-spinner
          class="w-full justify-center text-center"
          v-if="meta.isProcessing"
        />

        <div v-else-if="meta.showLoginForm || meta.showRegisterForm">
          <div class="text-left">
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
