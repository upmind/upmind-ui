<template>
  <section class="toggles w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Toggles Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <p>
      This will show a mix of global and independant toggle instances. <br />
      Global instances will stay in sync
    </p>

    <div class="my-4">
      <upm-toggle use-global>Global Instance</upm-toggle>
      <upm-toggle></upm-toggle>
      <upm-toggle use-global>Global Instance</upm-toggle>
    </div>

    <footer>
      <Debug
        title="Global Toggle"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      ></Debug>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useToggle } from "../";
import Debug from "@/components/Debug.vue";
import UpmToggle from "../components/Toggle.vue";

const { state, context, meta, errors } = useToggle({ useGlobal: true });
</script>
../useToggle ..
