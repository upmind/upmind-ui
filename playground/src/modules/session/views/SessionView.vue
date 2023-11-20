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
      <form
        @submit.prevent="login(model)"
        v-if="meta.showLoginForm && !meta.show2fa"
        class="card-body"
      >
        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="email">
            <span class="label-text">Your Email</span></label
          >
          <input
            class="input input-bordered w-full max-w-xs"
            name="email"
            type="email"
            v-model="model.email"
            autocomplete="email"
            :disabled="meta.isProcessing"
            required
            placeholder="name@email.com"
          />
        </fieldset>

        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="password">
            <span class="label-text">Your Password</span></label
          >

          <input
            class="input input-bordered w-full max-w-xs"
            name="password"
            type="password"
            v-model="model.password"
            autocomplete="current-password"
            :disabled="meta.isProcessing"
            placeholder="Use a strong password or passphrase"
            required
          />
        </fieldset>

        <div class="card-actions mt-8 justify-between">
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="meta.isProcessing"
          >
            login
          </button>
          <button class="btn btn-ghost" type="reset" @click.prevent="cancel">
            cancel
          </button>
        </div>
      </form>

      <form
        @submit.prevent="verify2fa(model.token)"
        v-if="meta.show2fa"
        class="card-body"
      >
        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="token">
            <span class="label-text">Your 2fa Code</span>
          </label>

          <input
            class="input input-bordered w-full max-w-xs"
            name="token"
            type="text"
            step="1"
            min="0"
            max="999999"
            mask="### ###"
            autocomplete="off"
            v-model="model.token"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <div class="card-actions mt-8 justify-between">
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="meta.isProcessing"
          >
            verify
          </button>
          <button class="btn btn-ghost" type="reset" @click.prevent="cancel">
            cancel
          </button>
        </div>
      </form>

      <form
        @submit.prevent="register(model)"
        v-if="meta.showRegisterForm"
        class="card-body"
      >
        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="firstname">
            <span class="label-text">Your First name</span>
          </label>
          <input
            class="input input-bordered w-full max-w-xs"
            name="firstname"
            v-model="model.firstname"
            autocomplete="given-name"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="lastname">
            <span class="label-text">Your Last Name</span>
          </label>
          <input
            class="input input-bordered w-full max-w-xs"
            name="lastname"
            v-model="model.lastname"
            autocomplete="family-name"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="firstname">
            <span class="label-text">Your Email</span>
          </label>
          <input
            class="input input-bordered w-full max-w-xs"
            name="email"
            type="email"
            v-model="model.email"
            autocomplete="email"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset class="form-control w-full max-w-xs">
          <label class="label" for="firstname">
            <span class="label-text">Your Password</span>
          </label>
          <input
            class="input input-bordered w-full max-w-xs"
            name="password"
            type="password"
            v-model="model.password"
            autocomplete="current-password"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset
          class="form-control w-full max-w-xs"
          v-for="field in registerFormCustomFields"
          :key="field.code"
        >
          <label class="label" :for="field.code">
            <span class="label-text">{{ field.name_translated }}</span>
          </label>
          <input
            class="input input-bordered w-full max-w-xs"
            :name="field.code"
            :type="field.display_type?.toLowerCase() || 'text'"
            v-model="model.custom_fields[field.code]"
            autocomplete="current-password"
            :disabled="meta.isProcessing"
            :required="field.required"
          />
        </fieldset>

        <div class="card-actions mt-8 justify-between">
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="meta.isProcessing"
          >
            continue
          </button>
          <button class="btn btn-ghost" type="reset" @click.prevent="cancel">
            cancel
          </button>
        </div>
      </form>
    </div>

    <footer>
      <debug
        title="Session"
        :state="{ session: state, guest: guest?.value, client: client?.value }"
        :context="context"
        :errors="errors"
        :meta="meta"
      ></debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSession } from "../";
import Debug from "@/components/Debug.vue";

const {
  state,
  context,
  errors,
  meta,
  // ---
  client,
  guest,
  // ---
  registerFormCustomFields,
  // ---
  showLogin,
  showRegister,
  login,
  verify2fa,
  register,
  logout,
  cancel,
  getUser
} = useSession();

const model = ref({
  firstname: "Test",
  lastname: "user 3",
  email: "user+3@test.com",
  password: "Passw0rd",
  token: null,
  custom_fields: {}
});

// ---
</script>
