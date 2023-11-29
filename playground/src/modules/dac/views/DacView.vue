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

    <upm-dac class="my-8" v-model="model" compact>
      <template #results="{ results, meta, isOpen, update }">
        <upm-dac-results-dropdown
          :results="results"
          :processing="meta.isProcessing"
          :open="isOpen"
          @change="update"
        />
      </template>
    </upm-dac>

    <footer>
      <upm-debug
        title="Dac"
        :context="{ model }"
        :open="{ context: true }"
      ></upm-debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { UpmDac, UpmDacResultsDropdown, UpmDebug } from "@upmind/components";

const model = ref("pewpew.com");
</script>
