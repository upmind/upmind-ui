<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Session is {{ state }}</h2>

      <slot name="actions">
        <button @click="showLogin" v-if="!isClient">Login&nbsp;Form</button>
        <button @click="showRegister" v-if="!isClient">
          Register&nbsp;Form
        </button>

        <button @click="logout" v-if="isClient && isLoggedIn">logout</button>

        <form
          @submit.prevent="login"
          v-if="isClient && showLoginForm && !isLoggedIn"
        >
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
      </slot>
    </header>

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
const { state, values, send, isLoggedIn, isClient, isProcessing } =
  useSession();

const model = ref({
  username: null,
  password: null
});

const showLoginForm = ref(false);
const showRegisterForm = ref(false);

function cancel() {
  send({
    type: "CANCEL"
  });

  model.value = {
    username: null,
    password: null
  };
  showLoginForm.value = false;
  showRegisterForm.value = false;
}

function showLogin() {
  send({
    type: "LOGIN"
  });

  showLoginForm.value = true;
  showRegisterForm.value = false;
}

function showRegister() {
  send({
    type: "REGISTER"
  });

  showLoginForm.value = false;
  showRegisterForm.value = true;
}

function login() {
  send({
    type: "AUTHENTICATE",
    data: model.value
  });
}

function register() {
  send({
    type: "CREATE",
    data: model.value
  });
}

function logout() {
  send({
    type: "LOGOUT"
  });
}
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
