<template>
  <section
    data-slot="portal-hero"
    class="relative flex min-h-91 flex-col justify-end overflow-hidden bg-black"
  >
    <img
      v-if="props.hero.image"
      :src="props.hero.image"
      alt=""
      class="absolute inset-0 size-full object-cover"
    />
    <!-- The scrim keeps the light ink legible over an arbitrary photograph —
         and IS the whole backdrop until the brand supplies one. -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/20"
    />
    <!-- `dark`: a photographic band is a dark region whatever the page mode,
         so its content — the breadcrumb module included — renders in the
         token system's own dark ink, never hardcoded whites. -->
    <div :class="measureClass" class="dark relative pb-12">
      <div class="flex items-end justify-between gap-3">
        <div class="flex min-w-0 flex-col gap-2">
          <PortalSlotContent :resolved-slot="props.hero.breadcrumb" />
          <PageTitle class="text-3xl">{{ props.title }}</PageTitle>
          <PageDescription v-if="props.description">
            {{ props.description }}
          </PageDescription>
        </div>
        <PortalSlotContent :resolved-slot="props.hero.actions" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/content/PortalHero
 * @description The full-bleed hero band (`ContentConfig.hero`) — the page's
 * own title and description rendered ON the shape's photographic backdrop,
 * with a breadcrumb module above and trailing actions beside. Mounted by the
 * LAYOUT ahead of the routed page (`ShellMain` is unpadded, so the band
 * reaches both viewport edges and starts at y=0, sliding under a `floating`
 * topbar); the pages suppress their own `PageHeader` while a hero is
 * declared, so the h1 renders exactly once. 364px tall — the reference's own
 * band, measured (its first white row sits at y364).
 */
import { PageDescription, PageTitle } from "@upmind/ui";
import { computed } from "vue";
import PortalSlotContent from "../shell/PortalSlotContent.vue";
import { contentMeasureClass } from "../shell/variants";
import type { ContentGutter, ContentMeasure } from "./types";
import type { ResolvedHero } from "../resolve";

defineOptions({ name: "PortalHero" });

const props = defineProps<{
  hero: ResolvedHero;
  /** The page identity the band carries — `ContentConfig.title`/`description`, threaded by the layout. */
  title?: string;
  description?: string;
  /** Aligns the band's inner track with the page measure below it. */
  measure?: ContentMeasure;
  /** The measure's gutter arrangement, threaded with it. */
  gutter?: ContentGutter;
}>();

const measureClass = computed(() =>
  contentMeasureClass(props.measure, props.gutter)
);
</script>
