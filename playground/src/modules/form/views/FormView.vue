<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Form Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <p>This render a JSON form that is generated from a JSON schema.</p>

    <JsonForm class="my-4" />

    <footer>
      <!-- <Debug
        title="Form"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      ></Debug> -->
    </footer>
  </section>
</template>

<script setup lang="ts">
// import { useForm } from "..";
import JsonForm from "../components/Form.vue";

// const { state, context, meta, errors } = useForm({ useGlobal: true });
</script>
