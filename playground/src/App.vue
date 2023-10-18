<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <nav class="vertical">
      <router-link v-for="route in routes" :key="route.path" :to="route.path">
        {{ upperFirst(route.name) }}
      </router-link>
    </nav>
  </header>

  <main>
    <router-view class="view" />
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import { upperFirst } from "lodash-es";

const router = useRouter();
const routes = ref(router.options.routes);
</script>

<style scoped lang="scss">
main {
  width: 100%;
  height: 100%;
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
  text-align: center;
  margin-top: 1em;
  padding: 1rem;

  a {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-left: 1px solid var(--color-border);

    &.router-link-exact-active {
      color: var(--color-text);

      &:hover {
        background-color: transparent;
      }
    }
  }

  a:first-of-type {
    border: 0;
  }

  @media (min-width: 1024px) {
    &.vertical {
      display: flex;
      flex-direction: column;
    }

    a {
      border-left: none;
      border-top: 1px solid var(--color-border);
    }
  }
}

@media (min-width: 1024px) {
  header {
    display: flex;
    flex-wrap: wrap;
    padding: 1em 0;
    // padding-right: calc(var(--section-gap) / 2);
    align-self: flex-start;
    justify-content: center;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  nav {
    text-align: left;
  }
  .view {
    // border-left: 1px solid var(--color-border);
  }
}
</style>
