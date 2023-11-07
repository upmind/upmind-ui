<template>
  <section class="brand">
    <header
      class="navbar bg-base-100 rounded-md shadow-md sticky top-0 z-10 px-4"
    >
      <h2 class="title m-0">
        Session is a
        {{
          meta.isAuthenticated
            ? "Client"
            : meta.isClient
            ? "becoming a Client"
            : "Guest"
        }}
      </h2>

      <div class="actions">
        <slot name="actions">
          <button @click="showLogin" v-if="!meta.isClient">Login</button>
          <button @click="showRegister" v-if="!meta.isClient">Register</button>
          <!-- <button @click="getUser" v-if="meta.isAuthenticated">get user</button> -->
          <button type="reset" @click="logout" v-if="meta.isAuthenticated">
            logout
          </button>
          <button type="reset" @click.prevent="cancel" v-if="client">
            cancel
          </button>
        </slot>
      </div>
    </header>

    <div class="content">
      <form @submit.prevent="login(model)" v-if="meta.showLoginForm">
        <fieldset>
          <label for="email">Your Email</label>
          <input
            name="email"
            type="email"
            v-model="model.email"
            autocomplete="email"
            :disabled="meta.isProcessing"
            required
            placeholder="name@email.com"
          />
        </fieldset>
        <fieldset>
          <label for="password">Your Password</label>

          <input
            name="password"
            type="password"
            v-model="model.password"
            autocomplete="current-password"
            :disabled="meta.isProcessing"
            placeholder="Use a strong password or passphrase"
            required
          />
        </fieldset>
        <div class="actions">
          <button type="submit" :disabled="meta.isProcessing">login</button>
          <button type="reset" @click.prevent="cancel">cancel</button>
        </div>
      </form>

      <form @submit.prevent="verify2fa(model.token)" v-if="meta.show2fa">
        <fieldset>
          <label for="token">Your 2fa Code </label>

          <input
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

        <div class="actions">
          <button type="submit" :disabled="meta.isProcessing">verify</button>
          <button type="reset" @click.prevent="cancel">cancel</button>
        </div>
      </form>

      <form @submit.prevent="register(model)" v-if="meta.showRegisterForm">
        <fieldset>
          <label for="firstname">Your First name</label>
          <input
            name="firstname"
            v-model="model.firstname"
            autocomplete="given-name"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset>
          <label for="lastname">Your Last Name</label>
          <input
            name="lastname"
            v-model="model.lastname"
            autocomplete="family-name"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset>
          <label for="firstname">Your Email</label>
          <input
            name="email"
            type="email"
            v-model="model.email"
            autocomplete="email"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset>
          <label for="firstname">Your Password</label>
          <input
            name="password"
            type="password"
            v-model="model.password"
            autocomplete="current-password"
            :disabled="meta.isProcessing"
            required
          />
        </fieldset>

        <fieldset v-for="field in registerFormCustomFields">
          <label :for="field.code">{{ field.name_translated }}</label>
          <input
            :name="field.code"
            :type="field.display_type?.toLowerCase() || 'text'"
            v-model="model.custom_fields[field.code]"
            autocomplete="current-password"
            :disabled="meta.isProcessing"
            :required="field.required"
          />
        </fieldset>
        <div class="actions">
          <button type="submit" :disabled="meta.isProcessing">continue</button>
          <button type="reset" @click.prevent="cancel">cancel</button>
        </div>
      </form>
    </div>

    <footer>
      <Debug
        title="Session"
        :state="{ session: state, guest: guest?.value, client: client?.value }"
        :context="context"
        :errors="errors"
        :meta="meta"
      ></Debug>
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
