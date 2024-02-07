<template>
  <section class="dac w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 px-4 rounded-box"
    >
      <div class="flex-1">
        <h2 class="title m-0">Dac Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div
      class="hero min-h-full py-44 bg-base-200 rounded-box my-4 relative z-10"
      :data-theme="activeTheme"
    >
      <div class="hero-content w-full">
        <div class="max-w-xl w-full">
          <h1 class="text-5xl font-bold text-primary">
            Choose <template v-if="multiple">Domain(s)</template
            ><template v-else>a Domain</template>&hellip;
          </h1>

          <upm-dac
            class="min-w-[20rem] max-w-4xl"
            v-model="model"
            :multiple="multiple"
            placeholder="Find your pefect domain &hellip;"
          />
        </div>
      </div>
    </div>

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
import { inject, ref } from "vue";
import { UpmDac, UpmDebug } from "@upmind/vue";

const multiple = ref(true);

// const model = ref(["pewpew.com", "pewpew.net"]);
// const model = multiple.value ? ref(["pewpew.com", "pewpew.net"]) : "pewpew.com";
const model = ref(multiple.value ? [] : "");
const activeTheme = inject("activeTheme");
</script>
