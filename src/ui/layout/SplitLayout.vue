<template>
  <div class="flex w-full">
    <article
      class="bg-surface flex h-screen w-1/2 flex-col justify-between px-32 pt-24 pb-9"
    >
      <header>
        <slot name="header-left" />
      </header>

      <div class="flex flex-col gap-24">
        <div class="flex flex-col gap-12">
          <section class="max-w-app-aside">
            <slot name="content-header" />
          </section>

          <section>
            <slot name="content" />
            <slot name="default" />
          </section>
        </div>

        <footer class="flex items-end justify-between">
          <slot name="footer-content" />
          <slot name="footer-copyright" />
        </footer>
      </div>
    </article>

    <div class="bg-canvas h-screen w-1/2" />
  </div>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef } from "vue";
import { useStyles } from "../../utils";
import config from "./layout.config";
import type { VariantProps } from "./types";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["split"], meta, config) as ComputedRef<{
  split: {
    root: string;
  };
}>;
</script>
