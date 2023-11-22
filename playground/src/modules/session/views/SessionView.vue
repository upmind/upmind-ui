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
            @click.prevent="cancel"
            v-if="client"
          >
            cancel
          </button>
        </slot>
      </div>
    </header>

    <div
      class="card card-compact card-bordered border-base-300 rounded-xl bg-base-200 shadow-sm overflow-hidden my-8 w-96 max-w-full"
      v-if="meta.showLoginForm || meta.show2fa || meta.showRegisterForm"
    >
      <div
        role="alert"
        class="alert alert-error rounded-none"
        v-if="meta.hasClientErrors"
      >
        <shield-exclamation-icon class="h-8 w-8" />
        <span>{{ clientErrors.message }}</span>
      </div>

      <auth-form
        v-if="meta.showLoginForm && !meta.show2fa"
        :processing="meta.isProcessing"
        @resolve="login"
        @reject="cancel"
        :additionalErrors="clientErrors?.data"
      ></auth-form>

      <twofa-form
        v-if="meta.show2fa"
        :processing="meta.isProcessing"
        @resolve="verify2fa"
        @reject="cancel"
        :additionalErrors="clientErrors?.data"
      ></twofa-form>

      <register-form
        v-if="meta.showRegisterForm"
        :schema="clientSchema"
        :uischema="clientUischema"
        :processing="meta.isProcessing"
        :loading="meta.isLoadingRegisterForm"
        :additionalErrors="clientErrors?.data"
        @resolve="register"
        @reject="cancel"
      >
      </register-form>
    </div>

    <footer>
      <debug
        title="Session"
        :state="{ session: state, guest: guest?.value, client: client?.value }"
        :context="context"
        :errors="{ errors, clientErrors }"
        :meta="meta"
      ></debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useSession } from "../";
import Debug from "@/components/Debug.vue";
import AuthForm from "../components/Auth.vue";
import TwofaForm from "../components/2fa.vue";
import RegisterForm from "../components/Register.vue";
import { ShieldExclamationIcon } from "@heroicons/vue/24/outline";

const {
  state,
  context,
  errors,
  meta,
  // ---
  client,
  guest,
  // ---
  clientSchema,
  clientUischema,
  clientErrors,
  // ---
  showLogin,
  showRegister,
  login,
  verify2fa,
  register,
  logout,
  cancel
} = useSession();

// ---
</script>
