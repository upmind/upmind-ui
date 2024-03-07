<template>
  <section class="w-full max-w-md mx-auto p-6">
    <div
      class="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700"
    >
      <div class="p-4 sm:p-7">
        <div class="text-center">
          <h1 class="block text-2xl font-bold text-gray-800 dark:text-white">
            Sign {{ meta.showLoginForm ? "in" : "up" }}
          </h1>

          <p
            v-if="meta.showLoginForm"
            class="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Don't have an account yet?
            <button
              class="text-primary decoration-2 hover:underline font-medium dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
              @click.prevent="showRegister"
            >
              Sign up here
            </button>
          </p>

          <p
            v-if="meta.showRegisterForm"
            class="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Already have an account?
            <button
              class="text-secondary decoration-2 hover:underline font-medium dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
              @click.prevent="showLogin"
            >
              Sign in here
            </button>
          </p>
        </div>

        <div class="mt-5">
          <div
            class="py-3 flex items-center text-xs text-gray-400 uppercase before:flex-[1_1_0%] before:border-t before:border-gray-200 before:me-6 after:flex-[1_1_0%] after:border-t after:border-gray-200 after:ms-6 dark:text-gray-500 dark:before:border-gray-600 dark:after:border-gray-600"
          >
            Or
          </div>

          <upm-auth-form
            v-if="!meta.isAuthenticated"
            class="mt-4 rounded-box gap-y-6"
            :data-theme="activeTheme"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, onMounted } from "vue";
import { useSession } from "@upmind/vue";

import UpmAuthForm from "../components/Form.vue";

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
  showLogin,
  showRegister,
  logout,
  reject,
} = useSession();

onMounted(() => {
  if (!meta.isAuthenticated) {
    showLogin();
  }
});

// ---
</script>
