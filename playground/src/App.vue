<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <!-- <nav> -->
    <!-- <RouterLink to="/">Home</RouterLink> -->
    <!-- <RouterLink to="/about">About</RouterLink> -->
    <!-- </nav> -->
  </header>

  <main class="view">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { RouterView } from "vue-router";
import type { UseApiFunctions } from "@/modules/api/types";
import { delay } from "lodash-es";

const upmind = inject("upmind") as UseApiFunctions;
console.log("App Intialized", upmind);

// attempt to get the data from a server

const req1 = upmind
  .get({
    url: "https://dummyjson.com/products/"
  })
  .then(response => console.log("request 1", response));

const req2 = upmind
  .get({
    url: "https://dummyjson.com/products/"
  })
  .then(response => console.log("request duplicate 1", response));

const req3 = upmind
  .get({
    url: "https://dummyjson.com/products/1"
  })
  .then(response => console.log("request 2", response));

const dupe2 = delay(
  url => {
    upmind.get({ url }).then(response => {
      console.log("request duplicate 2", response);
    });
  },
  1000,
  "https://dummyjson.com/products/"
);
</script>

<style scoped>
main {
  width: 100%;
  height: 100%;
}

.view {
  border-left: 1px solid var(--color-border);
}
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
