<template>
  <article class="w-full">
    <header class="flex">
      <div class="bg-canvas w-5/12">
        <div class="max-w-col-left ml-auto flex h-[100px] items-end">
          <slot name="header-left" />
        </div>
      </div>

      <div class="bg-surface w-7/12">
        <div class="max-w-col-right flex h-[100px] items-end justify-end">
          <slot name="header-right" />
        </div>
      </div>
    </header>

    <div class="flex min-h-screen">
      <aside class="bg-canvas w-5/12">
        <div
          class="max-w-col-left sticky top-0 ml-auto flex h-screen flex-col p-18 pl-0"
        >
          <slot name="content-header" />
          <div class="mt-auto pb-18">
            <slot name="aside" />
          </div>
        </div>
      </aside>

      <section class="bg-surface w-7/12 p-18 pr-0">
        <div class="max-w-col-right flex flex-col gap-12">
          <slot name="content" />
        </div>
      </section>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { VariantProps } from "./types";

defineProps<VariantProps>();
</script>
