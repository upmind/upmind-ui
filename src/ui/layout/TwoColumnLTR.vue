<template>
  <article class="bg-surface lg:canvas-gradient w-full">
    <header class="flex w-full justify-center">
      <div
        class="basis-app-content bg-surface box-content min-w-0 shrink px-8 pb-1 lg:px-18"
      >
        <div class="lg:w-app-content flex h-[100px] items-end">
          <slot name="header-left" />
        </div>
      </div>

      <div
        class="basis-app-aside bg-surface box-content min-w-0 shrink px-8 pb-1 lg:bg-transparent lg:px-18"
      >
        <div class="lg:w-app-aside flex h-[100px] items-end justify-end">
          <slot name="header-right" />
        </div>
      </div>
    </header>

    <section class="flex w-full justify-center">
      <div
        class="basis-app-content bg-surface box-content min-w-0 shrink px-8 pt-18 lg:px-18"
      >
        <div class="w-app-content">
          <slot name="content-header" />
        </div>
      </div>

      <div
        class="basis-app-aside box-content hidden min-w-0 shrink px-18 pt-18 lg:block"
      >
        <div class="w-app-aside" />
      </div>
    </section>

    <section class="flex w-full justify-center">
      <div
        class="basis-app-content bg-surface box-content min-w-0 shrink px-8 pt-18 lg:px-18"
      >
        <div class="w-app-content flex flex-col gap-12">
          <slot name="content" />
        </div>
      </div>

      <div
        class="basis-app-aside box-content hidden min-w-0 shrink px-18 pt-9 lg:block"
      >
        <aside class="w-app-aside sticky top-0 pt-9">
          <slot name="aside" />
        </aside>
      </div>
    </section>

    <div class="flex w-full justify-center">
      <div
        class="basis-app-content bg-surface box-content min-w-0 shrink px-8 lg:px-18"
      >
        <div class="w-app-content h-11" />
      </div>

      <div
        class="basis-app-aside box-content hidden min-w-0 shrink px-18 lg:block"
      >
        <div class="w-app-aside h-11" />
      </div>
    </div>

    <div class="flex w-full items-end justify-center">
      <div
        class="basis-app-content bg-surface box-content min-w-0 shrink px-8 pb-9 lg:px-18 lg:pt-18"
      >
        <div class="w-app-content">
          <slot name="footer" />
        </div>
      </div>

      <div
        class="basis-app-aside box-content min-w-0 shrink px-18 pb-9 lg:pt-18"
      >
        <div class="w-app-aside">
          <slot name="footer-aside" />
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { VariantProps } from "./types";

defineProps<VariantProps>();
</script>
