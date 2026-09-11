<template>
  <component
    :is="meta.element"
    class="rounded-button focus-visible:outline-ring/40 flex min-w-0 items-center gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
    v-bind="meta.attrs"
  >
    <Avatar
      v-if="meta.isImageMark"
      :src="props.imageSrc"
      :alt="''"
      aria-hidden="true"
    />
    <span
      v-else-if="meta.isMonogramMark"
      class="rounded-button bg-primary text-primary-contrast grid size-8 shrink-0 place-items-center text-sm font-bold"
      aria-hidden="true"
      >{{ meta.monogram }}</span
    >
    <span
      :class="
        meta.wordmarkHidden
          ? 'sr-only'
          : 'type-display-bold text-display truncate text-base tracking-tight'
      "
      >{{ props.label }}</span
    >
  </component>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/brand/Brand
 * @description The `brand` module — mark plus wordmark, linking home. The one
 * module carrying the `identity` accept tag, so a shape with no sidebar can
 * still seat its logo in `topbar.left`. The mark is a named option
 * (BRAND_MARK): monogram chip, photo, or none — plus `markOnly` for the
 * topbar avatar-chip form.
 */
import { Avatar, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { BRAND_MARK } from "./types";
import { assign } from "lodash-es";
import type { BrandModuleProps } from "./types";
import { NuxtLink } from "#components";

defineOptions({ name: "PortalBrand" });

const props = defineProps<BrandModuleProps>();

/**
 * Where the mark goes, and what renders it. A brand that publishes its own
 * site sends the mark THERE — the portal's router has nothing to route to
 * outside itself, so that branch is a plain anchor rather than a link.
 */
function markDestination() {
  const isExternal = props.href !== undefined && props.href !== "";
  if (isExternal) {
    // `rel` and nothing else: an anchor that carried a `to` would hand the
    // router a destination it cannot route to.
    return {
      element: "a",
      destination: { href: props.href, rel: "noopener" }
    } as const;
  }
  return {
    element: NuxtLink,
    destination: { to: props.to ?? "/" }
  } as const;
}

const meta = computed(() => {
  const mark = props.mark ?? BRAND_MARK.MONOGRAM;
  const destination = markDestination();
  return {
    isImageMark: mark === BRAND_MARK.IMAGE && props.imageSrc !== undefined,
    isMonogramMark: mark === BRAND_MARK.MONOGRAM,
    monogram: props.monogram ?? props.label.slice(0, 1),
    wordmarkHidden: props.markOnly || props.collapsed,
    element: destination.element,
    attrs: assign(
      {},
      destination.destination,
      useTestAttrs({ key: "portal-brand" })
    )
  };
});
</script>
