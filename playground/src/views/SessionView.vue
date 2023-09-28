<template>
  <section class="brand">
    <h2 class="title">{{ role.toUpperCase() }} Session is {{ state }}</h2>

    <div class="values">
      <code>
        <pre>{{ values }}</pre>
      </code>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSession } from "@/modules/session";
const { state, values, role } = useSession();
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
