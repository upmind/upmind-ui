<template>
  <section class="system w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">
          System is {{ meta.isLoading ? "loading" : "ready" }}
        </h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <footer>
      <Debug
        title="System"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useSystem } from "..";
import Debug from "@/components/Debug.vue";

const { state, context, meta, errors } = useSystem();
</script>
