<template>
  <div
    class="w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-wrap bg-gradient-to-br from-base to-neutral-200"
    :data-theme="activeTheme"
  >
    <div
      class="w-full md:grid md:grid-cols-3 lg:grid-cols-2 md:gap-8 xl:gap-12 md:items-center"
    >
      <div class="relative h-1/4 sm:h-full w-full md:order-last">
        <img
          class="w-full h-full object-contain m-0 p-8"
          :src="`/illustration-${activeTheme}.svg`"
          alt="Illustration of a person entering a password"
        />
      </div>

      <div class="md:col-span-2 lg:col-auto py-8 px-4 sm:px-6 lg:px-8">
        <div
          class="bg-base-50 text-base-content border p-4 sm:p-7 border-base-300 rounded-xl shadow-lg"
        >
          <div class="text-center">
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
const { meta, showLogin, showRegister } = useSession();
const activeTheme = inject("activeTheme");

// Lets automatically show the login form and not wait for the user to click the login button
if (!meta.isAuthenticated) showLogin();

// ---
</script>
