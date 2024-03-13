<template>
  <div
    class="border lg:border-none bg-base-50 text-base-content w-full mx-auto h-full flex flex-wrap"
    :data-theme="activeTheme"
  >
    <div
      class="h-screen overflow-auto w-full lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12"
    >
      <div
        class="flex flex-wrap content-center bg-gradient-to-bl from-neutral to-primary-900 text-neutral-content lg:order-last py-12 px-6 sm:px-6 lg:px-8"
      >
        <h1
          class="block text-3xl font-bold text-inherit sm:text-4xl lg:text-6xl lg:leading-tight dark:text-white max-w-lg"
        >
          Start your journey with <span class="text-primary">Upmind</span>
        </h1>
        <p class="mt-3 text-lg max-w-lg">
          Entrepreneurs from around the world showcase and sell their services
          on Upmind - the home to the world’s best billing, sales and automation
          platform for service businesses.
        </p>

        <!-- End Buttons -->
      </div>

      <div
        class="self-center col-span-1 mx-4 sm:mx-6 lg:mx-8 py-8 px-4 sm:px-6 lg:px-8"
      >
        <div class="">
          <div class="text-left">
            <h3 class="block text-2xl font-bold text-inherit">
              Sign {{ meta.showLoginForm ? "in" : "up" }}
            </h3>

            <p v-if="meta.showLoginForm" class="mt-2 text-sm text-base-content">
              Don't have an account yet?
              <button
                class="text-primary decoration-2 hover:underline font-medium"
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
                class="text-secondary decoration-2 hover:underline font-medium"
                @click.prevent="showLogin"
              >
                Sign in here
              </button>
            </p>
          </div>

          <div
            class="my-5 py-3 flex items-center text-xs text-base-400 uppercase before:flex-[1_1_0%] before:border-t before:border-base-400 before:me-6 after:flex-[1_1_0%] after:border-t after:border-base-400 after:ms-6"
          >
            Or
          </div>

          <upm-auth-form v-if="!meta.isAuthenticated" class="gap-y-8" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useSession } from "@upmind/vue";
import UpmAuthForm from "../components/Form.vue";
import UpmIcon from "@/components/Icon.vue";
const { meta, showLogin, showRegister } = useSession();
const activeTheme = inject("activeTheme");

// Lets automatically show the login form and not wait for the user to click the login button
if (!meta.isAuthenticated) showRegister();

// ---
</script>
