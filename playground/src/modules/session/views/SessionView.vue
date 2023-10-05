<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Session is {{ state }}</h2>

      <slot name="actions">
        <button @click="swapRole('client')" v-if="!isClient">swap</button>
        <button @click="logout" v-if="isClient && isLoggedIn">logout</button>

        <form @submit.prevent="login" v-if="isClient && !isLoggedIn">
          <p>
            <input
              name="email"
              type="email"
              v-model="creds.username"
              autocomplete="email"
              :disabled="creds.isProcessing"
            />
          </p>
          <p>
            <input
              name="password"
              type="password"
              v-model="creds.password"
              autocomplete="current-password"
              :disabled="creds.isProcessing"
            />
          </p>
          <div>
            <button type="submit" :disabled="creds.isProcessing">login</button>
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
const { state, values, send, isLoggedIn, isClient } = useSession();

const creds = ref({
  username: null,
  password: null,
  grant_type: "password" //GrantTypes.PASSWORD,
});

// add a property to the creds object for processing state
Object.defineProperty(creds.value, "isProcessing", {
  value: false,
  writable: true
});

function swapRole(role = "client") {
  send({
    type: "SWAP",
    data: role
  });
}

function login() {
  creds.value.isProcessing = true;

  send({
    type: "LOGIN",
    data: creds.value
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
