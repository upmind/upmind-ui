<template>
  <section class="session w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
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
          <button
            class="btn btn-primary join-item"
            @click="showLogin"
            v-if="!meta.isClient"
          >
            Login
          </button>
          <button
            class="btn btn-primary btn-outline join-item"
            @click="showRegister"
            v-if="!meta.isClient"
          >
            Register
          </button>
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

    <div
      class="card card-compact card-bordered border-base-300 rounded-xl bg-base-100 shadow-sm overflow-hidden my-8 w-96 max-w-full"
      v-if="meta.showLoginForm || meta.show2fa || meta.showRegisterForm"
      :data-theme="activeTheme"
    >
      <div class="card-body">
        <h3 class="card-title m-0 justify-center" v-if="schema?.title">
          {{ schema.title }}
        </h3>

        <upm-form-generator
          :loading="meta.isFormLoading"
          :processing="meta.isProcessing"
          :model-value="model"
          :schema="schema"
          :uischema="uischema"
          :additional-errors="errors?.data"
          @reject="reject"
          @resolve="resolve"
        >
          <template #actions="{ meta: formMeta, doReject }">
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="!formMeta.isValid || formMeta.isProcessing"
            >
              Continue
            </button>
            <button
              class="btn btn-ghost"
              type="reset"
              @click.prevent="doReject"
            >
              Cancel
            </button>
          </template>
        </upm-form-generator>
      </div>
    </div>

    <footer>
      <upm-debug
        title="Session"
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
import { useSession } from "../";
import { UpmDebug } from "@upmind/components";
import { UpmFormGenerator } from "@upmind/components";
import { ShieldExclamationIcon, XMarkIcon } from "@heroicons/vue/24/outline";

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
  schema,
  uischema,
  model,
  // ---
  clearErrors,
  showLogin,
  showRegister,
  logout,
  resolve,
  reject
} = useSession();

// ---
</script>
