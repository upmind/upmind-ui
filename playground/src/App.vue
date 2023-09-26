<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/requests">Requests</RouterLink>
      <!-- <RouterLink to="/about">About</RouterLink> -->
    </nav>
  </header>

  <main class="view">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";

import { inject } from "vue";
import type { UseApiFunctions } from "@/modules/api/types";
import { delay, forEach } from "lodash-es";

const upmind = inject("upmind") as UseApiFunctions;
console.log("Upmind Intialized", upmind);

const TIME = {
  IMMIDIATE: 0,
  MILLISECOND: 1,
  get SECOND() {
    return 1000 * this.MILLISECOND;
  },
  get MINUTE() {
    return 60 * this.SECOND;
  },
  get HOUR() {
    return 60 * this.MINUTE;
  },
  get DAY() {
    return 24 * this.HOUR;
  },
  get WEEK() {
    return 7 * this.DAY;
  },
  get MONTH() {
    return 30 * this.DAY;
  },
  get YEAR() {
    return 365 * this.DAY;
  }
};

const requests = [
  { url: "https://dummyjson.com/products/", delay: TIME.IMMIDIATE },
  { url: "https://dummyjson.com/products/1", delay: TIME.IMMIDIATE },
  { url: "https://dummyjson.com/products/2", delay: TIME.IMMIDIATE },

  { url: "https://dummyjson.com/products/", delay: TIME.IMMIDIATE },
  { url: "https://dummyjson.com/products/1", delay: TIME.IMMIDIATE },
  { url: "https://dummyjson.com/products/2", delay: TIME.IMMIDIATE },

  { url: "https://dummyjson.com/products/", delay: TIME.SECOND * 10 },
  { url: "https://dummyjson.com/products/1", delay: TIME.SECOND * 10 },
  { url: "https://dummyjson.com/products/2", delay: TIME.SECOND * 10 },

  { url: "https://dummyjson.com/products/", delay: TIME.MINUTE },
  { url: "https://dummyjson.com/products/1", delay: TIME.MINUTE },
  { url: "https://dummyjson.com/products/2", delay: TIME.MINUTE },

  {
    url: "https://dummyjson.com/products/",
    delay: TIME.MINUTE + TIME.SECOND * 10
  },
  {
    url: "https://dummyjson.com/products/1",
    delay: TIME.MINUTE + TIME.SECOND * 10
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: TIME.MINUTE + TIME.SECOND * 10
  },

  { url: "https://dummyjson.com/products/", delay: TIME.MINUTE * 2 },
  { url: "https://dummyjson.com/products/1", delay: TIME.MINUTE * 2 },
  { url: "https://dummyjson.com/products/2", delay: TIME.MINUTE * 2 }
];

forEach(requests, request => {
  delay(
    url => {
      console.log("fetching...", request.url, request.delay);
      upmind.get({ url });
    },
    request.delay,
    request.url
  );
});
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
