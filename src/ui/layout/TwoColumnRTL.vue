<template>
  <article class="bg-surface lg:canvas-gradient-rtl w-full">
    <header class="flex w-full justify-center">
      <div
        class="basis-app-aside bg-surface box-content min-w-0 px-8 pb-1 lg:bg-transparent lg:px-18"
      >
        <div class="lg:w-app-aside flex h-[100px] items-end">
          <slot name="header-left" />
        </div>
      </div>

      <div
        class="basis-app-content bg-surface box-content min-w-0 px-8 pb-1 lg:px-18"
      >
        <div class="lg:w-app-content flex h-[100px] items-end justify-end">
          <slot name="header-right" />
        </div>
      </div>
    </header>

    <section class="flex w-full justify-center">
      <div
        class="basis-app-aside box-content hidden min-w-0 px-18 pt-18 lg:block"
      >
        <div class="w-app-aside flex h-full min-h-screen flex-col">
          <div>
            <slot name="content-header" />
          </div>

          <aside class="sticky bottom-18 mt-auto">
            <slot name="aside" />
          </aside>
        </div>
      </div>

      <div
        class="basis-app-content bg-surface box-content min-w-0 px-8 pt-18 lg:px-18"
      >
        <div class="w-app-content flex flex-col gap-12">
          <slot name="content" />
        </div>
      </div>
    </section>

    <div class="flex w-full justify-center">
      <div class="basis-app-aside box-content hidden min-w-0 px-18 lg:block">
        <div class="w-app-aside h-11" />
      </div>

      <div
        class="basis-app-content bg-surface box-content min-w-0 px-8 lg:px-18"
      >
        <div class="w-app-content h-11" />
      </div>
    </div>

    <footer class="flex w-full items-end justify-center">
      <div class="basis-app-aside box-content min-w-0 px-18 pb-9 lg:pt-18">
        <div class="w-app-aside">
          <slot name="footer-content" />
        </div>
      </div>

      <div
        class="basis-app-content bg-surface box-content min-w-0 px-8 pb-9 lg:px-18 lg:pt-18"
      >
        <div class="w-app-content flex items-end justify-between">
          <slot name="footer-copyright" />
          <slot name="footer-actions" />
        </div>
      </div>
    </footer>
  </article>
</template>

<script lang="ts" setup>
import type { VariantProps } from "./types";

defineProps<VariantProps>();
</script>
