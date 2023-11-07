<template>
  <section class="brand">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 px-4 rounded-full"
    >
      <h2 class="title m-0">
        Brand is {{ meta.isLoading ? "loading" : "ready" }}
      </h2>
      <div><slot name="actions"> </slot></div>
    </header>

    <footer>
      <Debug
        title="Brand"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useBrand } from "../";
import Debug from "@/components/Debug.vue";

const { state, context, meta, errors } = useBrand();
</script>
