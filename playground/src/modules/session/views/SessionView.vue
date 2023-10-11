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
      </slot>
    </header>

    <div class="toolbar" v-if="client">
      <h2 class="title">Client is {{ client.value }}</h2>
      <button @click.prevent="cancel">cancel</button>
    </div>

    <form @submit.prevent="login(model)" v-if="showLoginForm">
      <p>
        <input
          name="email"
          type="email"
          v-model="model.username"
          autocomplete="email"
          :disabled="isProcessing"
        />
      </p>
      <p>
        <input
          name="password"
          type="password"
          v-model="model.password"
          autocomplete="current-password"
          :disabled="isProcessing"
        />
      </p>
      <div>
        <button type="submit" :disabled="isProcessing">login</button>
        <button @click.prevent="cancel">cancel</button>
      </div>
    </form>

    <form @submit.prevent="verify2fa(model.token)" v-if="show2fa">
      <p>
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
        />
      </p>

      <div>
        <button type="submit" :disabled="isProcessing">verify</button>
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
import { ref, computed } from "vue";
import { useSession } from "../";
const {
  state,
  values,
  // ---
  client,
  guest,
  // ---
  isAuthenticated,
  isClient,
  isProcessing,
  show2fa,
  showLoginForm,
  showReCaptcha,
  showRegisterForm,
  // ---
  showLogin,
  showRegister,
  login,
  verify2fa,
  register,
  logout,
  cancel
} = useSession();

const model = ref({
  username: null,
  password: null,
  token: null
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
