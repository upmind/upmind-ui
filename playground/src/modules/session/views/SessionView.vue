<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Session is a {{ state }}</h2>

      <slot name="actions"></slot>
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
const { state, values } = useSession();
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
