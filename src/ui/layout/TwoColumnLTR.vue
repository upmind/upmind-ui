<template>
  <article class="canvas-gradient w-full">
    <header class="flex w-full justify-center">
      <div class="basis-app-content box-content bg-surface min-w-0 shrink px-18 pb-1">
        <div class="w-app-content flex h-[100px] items-end">
          <slot name="header-left" />
        </div>
      </div>

      <div class="basis-app-aside box-content min-w-0 shrink px-18 pb-1">
        <div class="w-app-aside flex h-[100px] items-end justify-end">
          <slot name="header-right" />
        </div>
      </div>
    </header>

    <section class="flex w-full justify-center">
      <div class="basis-app-content box-content bg-surface min-w-0 shrink px-18 pt-18">
        <div class="w-app-content">
          <slot name="content-header" />
        </div>
      </div>

      <div class="basis-app-aside box-content min-w-0 shrink px-18 pt-18">
        <div class="w-app-aside h-4" />
      </div>
    </section>

    <section class="flex w-full justify-center">
      <div class="basis-app-content box-content bg-surface min-w-0 shrink px-18 pt-18">
        <div class="w-app-content flex flex-col gap-12">
          <slot name="content" />
        </div>
      </div>

      <div class="basis-app-aside box-content min-w-0 shrink px-18 pt-18">
        <aside class="w-app-aside sticky top-0">
          <slot name="aside" />
        </aside>
      </div>
    </section>

    <footer class="flex w-full justify-center">
      <div class="basis-app-content box-content bg-surface min-w-0 shrink px-18">
        <div class="w-app-content h-32" />
      </div>

      <div class="basis-app-aside box-content min-w-0 shrink px-18">
        <div class="w-app-aside h-32" />
      </div>
    </footer>
  </article>
</template>

<script lang="ts" setup>
import type { VariantProps } from "./types";

defineProps<VariantProps>();
</script>

<style scoped>
.canvas-gradient {
  background:
    linear-gradient(to right, var(--color-core-surface) 50%, transparent 50%),
    linear-gradient(
      to bottom right,
      var(--color-primary-default) 0%,
      var(--color-primary-default-stop) 100%
    );
}
</style>
