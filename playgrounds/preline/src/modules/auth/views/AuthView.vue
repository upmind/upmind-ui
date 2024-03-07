<template>
  <section class="session">
    <article class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 min-h-screen">
      <header class="max-w-3xl">
        <p class="mb-2 text-sm font-semibold text-primary">
          Authentication Flow
        </p>
        <h1
          class="block text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white"
        >
          Default view for authentication
        </h1>
        <p class="mt-2 text-lg text-gray-800 dark:text-gray-400">
          This is a simple example of a page with a form for login and a form
          for registration.
        </p>
        <div class="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <button
            class="w-full sm:w-auto py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-primary text-white hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            disabled
          >
            <upm-icon name="code" class="size-4 stroke-current" />

            Show code
          </button>

          <pv-drawer
            contentId="debug-auth-flow"
            title="Debug Auth Flow"
            action="Debug"
            class="text-sm border border-primary text-primary bg-transparent hover:bg-primary-700 hover:text-primary-content transition-colors"
          >
            <template #action>
              <upm-icon name="debug" class="size-4 fill-current -mt-1" />
              <span>Debug Auth Flow</span>
            </template>

            <upm-debug
              id="debug-auth-flow"
              title="Session"
              :open="{ state }"
              :state="{
                session: state,
                guest: guest?.value,
                client: client?.value,
              }"
              :context="context"
              :errors="errors"
              :meta="meta"
            />
          </pv-drawer>
        </div>
      </header>

      <div class="canvas w-full min-h-screen my-12">
        <upm-desktop v-if="isDesktop" class="prose" />
        <upm-tablet v-else-if="isTablet" class="prose" />
        <upm-mobile v-else class="prose" />
      </div>

      <footer></footer>
    </article>
  </section>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useSession } from "@upmind/vue";
import { UpmDebug } from "@upmind/ui";
import PvDrawer from "@/components/Drawer.vue";
import UpmIcon from "@/components/Icon.vue";
import UpmMobile from "@/components/Mobile.vue";
import UpmTablet from "@/components/Tablet.vue";
import UpmDesktop from "@/components/Desktop.vue";

const { isDesktop, isTablet } = inject("resolution");

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
