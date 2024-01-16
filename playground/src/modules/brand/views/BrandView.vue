<template>
  <section class="brand w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-box"
    >
      <div class="flex-1">
        <h2 class="title m-0">
          Brand is {{ meta.isLoading ? "loading" : "ready" }}
        </h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <footer>
      <upm-debug
        title="Brand"
        :state="state"
        :context="context"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useBrand } from "../";
import { UpmDebug } from "@upmind/components";

const { state, context, meta, errors } = useBrand();
</script>
