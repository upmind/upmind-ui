<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Session is {{ state }}</h2>

      <slot name="actions">
        <button @click="showLogin" v-if="!isClient">Login&nbsp;Form</button>
        <button @click="showRegister" v-if="!isClient">
          Register&nbsp;Form
        </button>

        <button @click="logout" v-if="isAuthenticated">logout</button>

        <button @click="getUser" v-if="isAuthenticated">get user</button>
      </slot>
    </header>

    <div class="toolbar" v-if="client">
      <h2 class="title">Client is {{ client.value }}</h2>
      <button @click.prevent="cancel">cancel</button>
    </div>

    <form @submit.prevent="login(model)" v-if="showLoginForm">
      <p>
        <label for="email">Your Email</label>
        <input
          name="email"
          type="email"
          v-model="model.email"
          autocomplete="email"
          :disabled="isProcessing"
          required
        />
      </p>
      <p>
        <label for="password">Your Password</label>

        <input
          name="password"
          type="password"
          v-model="model.password"
          autocomplete="current-password"
          :disabled="isProcessing"
          required
        />
      </p>
      <div>
        <button type="submit" :disabled="isProcessing">login</button>
        <button @click.prevent="cancel">cancel</button>
      </div>
    </form>

    <form @submit.prevent="verify2fa(model.token)" v-if="show2fa">
      <p>
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
          :disabled="isProcessing"
          required
        />
      </p>

      <div>
        <button type="submit" :disabled="isProcessing">verify</button>
        <button @click.prevent="cancel">cancel</button>
      </div>
    </form>

    <form @submit.prevent="register(model)" v-if="showRegisterForm">
      <p>
        <label for="firstname">Your First name</label>
        <input
          name="firstname"
          v-model="model.firstname"
          autocomplete="given-name"
          :disabled="isProcessing"
          required
        />
      </p>
      <p>
        <label for="lastname">Your Last Name</label>
        <input
          name="lastname"
          v-model="model.lastname"
          autocomplete="family-name"
          :disabled="isProcessing"
          required
        />
      </p>
      <p>
        <label for="firstname">Your Email</label>
        <input
          name="email"
          type="email"
          v-model="model.email"
          autocomplete="email"
          :disabled="isProcessing"
          required
        />
      </p>
      <p>
        <label for="firstname">Your Password</label>
        <input
          name="password"
          type="password"
          v-model="model.password"
          autocomplete="current-password"
          :disabled="isProcessing"
          required
        />
      </p>
      <p v-for="field in registerFormCustomFields">
        <label :for="field.code">{{ field.name_translated }}</label>
        <input
          :name="field.code"
          :type="field.display_type?.toLowerCase() || 'text'"
          v-model="model.custom_fields[field.code]"
          autocomplete="current-password"
          :disabled="isProcessing"
          :required="field.required"
        />
      </p>
      <div>
        <button type="submit" :disabled="isProcessing">continue</button>
        <button @click.prevent="cancel">cancel</button>
      </div>
    </form>

    <div class="values">
      <code>
        <pre>{{ values }}</pre>
      </code>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSession } from "../";
const {
  state,
  values,
  // ---
  client,
  // ---
  isAuthenticated,
  isClient,
  isProcessing,
  show2fa,
  showLoginForm,
  showReCaptcha,
  showRegisterForm,
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

<style scoped lang="scss">
.brand {
  .values {
    margin-top: 1em;
    &:not(:last-child) {
      border-bottom: 1px solid whitesmoke;
      padding-bottom: 1em;
    }
  }
}
</style>
