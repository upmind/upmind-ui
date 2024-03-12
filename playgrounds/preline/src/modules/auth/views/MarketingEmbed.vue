<template>
  <div
    class="bg-base text-base-content w-full mx-auto h-full flex flex-wrap"
    :data-theme="activeTheme"
  >
    <div
      class="h-screen overflow-auto w-full md:grid md:grid-cols-2 md:gap-8 xl:gap-12"
    >
      <div
        class="flex flex-wrap content-center bg-gradient-to-bl from-neutral to-primary-900 text-neutral-content lg:order-last p-4 sm:p-6 lg:p-8"
      >
        <h1
          class="block text-3xl font-bold text-inherit sm:text-4xl lg:text-6xl lg:leading-tight dark:text-white"
        >
          Start your journey with <span class="text-primary">Upmind</span>
        </h1>
        <p class="mt-3 text-lg">
          Hand-picked professionals and expertly crafted components, designed
          for any kind of entrepreneur.
        </p>

        <!-- Buttons -->
        <div class="mt-7 grid gap-3 w-full sm:inline-flex">
          <a
            class="py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-primary text-white hover:bg-primary-800 disabled:opacity-50 disabled:pointer-events-none"
            href="#"
          >
            Get started
            <upm-icon name="chevron-right" class="flex-shrink-0 size-4" />
          </a>
          <a
            class="py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-base text-inherit hover:text-primary hover:border-primary disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            href="#"
          >
            Contact sales team
          </a>
        </div>
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
