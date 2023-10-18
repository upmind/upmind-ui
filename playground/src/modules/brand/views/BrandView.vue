<template>
  <section class="brand">
    <header class="toolbar">
      <h2 class="title">Brand is {{ meta.isLoading ? "loading" : "ready" }}</h2>
      <div><slot name="actions"> </slot></div>
    </header>

    <footer>
      <Debug
        title="Brand"
        :state="state"
        :values="values"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useBrand } from "../";
import Debug from "@/components/Debug.vue";

const { state, values, meta, errors } = useBrand();
</script>

<style scoped lang="scss">
.brand {
  .values {
    margin-top: 1em;
    &:not(:last-child) {
      border-bottom: 1px solid var(--upm-c-white-mute);
      padding-bottom: 1em;
    }
  }
}
</style>
