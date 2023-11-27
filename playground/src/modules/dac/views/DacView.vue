<template>
  <section class="dac w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Dac Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <upm-dac />

    <footer></footer>
  </section>
</template>

<script setup lang="ts">
import { UpmDac } from "@upmind/components";
</script>
