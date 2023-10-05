<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Session is a {{ state }}</h2>

      <slot name="actions">
        <button @click="swapRole('client')" v-if="!isClient">swap</button>
        <button @click="login" v-if="isClient && !isLoggedIn">login</button>
        <button @click="logout" v-if="isClient && isLoggedIn">logout</button>
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
import { useSession } from "../";
const { state, values, send, isLoggedIn, isClient } = useSession();

const creds = {};

function swapRole(role = "client") {
  send({
    type: "SWAP",
    data: role
  });
}

function login() {
  send({
    type: "LOGIN",
    data: creds
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
