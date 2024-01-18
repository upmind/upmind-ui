<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
    >
      <div class="flex-1">
        <h2 class="title m-0">Place Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <div
      :data-theme="activeTheme"
      class="bg-base-200 rounded-box my-8 max-w-screen-lg"
    >
      <!-- todo add a search for places -->

      <!-- <upm-search
         v-if="!meta.isLoading"
        :model-value="search"
        @update:modelValue="search = $event"
        placeholder="Search for places"
      /> -->

      <upm-form-generator
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        @update:modelValue="input"
        @reject="clear"
        @resolve="update"
        class="p-4"
      />
    </div>

    <footer>
      <upm-debug
        title="System"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount } from "vue";
import { UpmFormGenerator } from "@upmind/components";
import { useSystemPlace } from "..";
import { UpmDebug } from "@upmind/components";

const activeTheme = inject("activeTheme");

const {
  state,
  context,
  meta,
  errors,
  model,
  schema,
  uischema,
  input,
  // search,
  update,
  clear,
  destroy
} = useSystemPlace();

onBeforeUnmount(() => {
  destroy();
});
</script>
