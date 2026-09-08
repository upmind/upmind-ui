<template>
  <slot v-if="meta.isBare" />

  <Card
    v-else
    :id="props.anchor"
    :variant="meta.cardVariant"
    :title="props.header?.title"
    :description="props.header?.description"
    :class="meta.classes.root"
    :ui="meta.ui"
    :data-attrs="{
      'data-test-key': 'portal-section',
      'data-test-value': meta.surface
    }"
  >
    <template v-if="props.header?.actions" #action>
      <PortalSlotContent :resolved-slot="props.header.actions" />
    </template>

    <!-- The `controls` band: full measure, under the description and above the
         row's own slots. Its two positions are laid apart on ONE line here
         rather than through a module group — the group axes are shared by every
         other call site, and the vertical one shrink-wraps its members. -->
    <div
      v-if="meta.hasControls"
      data-slot="portal-row-controls"
      :class="ROW_CONTROLS_BAND_CLASS"
    >
      <div class="min-w-0">
        <PortalSlotContent :resolved-slot="props.header?.controls?.start" />
      </div>
      <div class="min-w-0">
        <PortalSlotContent :resolved-slot="props.header?.controls?.end" />
      </div>
    </div>

    <slot />

    <template v-if="props.footer" #footer>
      <PortalSlotContent :resolved-slot="props.footer" />
    </template>
  </Card>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/content/PortalSection
 * @description A row's surface, heading and footer — the three shapes every
 * reference portal repeats around its content: a bare titled block
 * ("My Sessions", "Recent orders"), a bordered panel, and a panel whose
 * header carries the brand (Rockzone's "Recent Progress"). Built on the
 * composed `Card`, never its parts (code-ui.companion.md CC-C), so the look
 * stays the library's; this file owns only which regions appear and the
 * padding each surface cancels.
 *
 * A row declaring no surface, header or footer renders its slots BARE — the
 * wrapper is absent, not an empty card, so every row written before this
 * existed renders unchanged.
 */
import { Card } from "@upmind/ui";
import { computed } from "vue";
import PortalSlotContent from "../shell/PortalSlotContent.vue";
import { ROW_SURFACE } from "./types";
import {
  ROW_CONTROLS_BAND_CLASS,
  rowSurfaceCardVariant,
  rowSurfaceClasses
} from "./variants";
import type { PortalSectionProps } from "./types";

defineOptions({ name: "PortalSection" });

const props = defineProps<PortalSectionProps>();

const meta = computed(() => {
  const surface = props.surface ?? ROW_SURFACE.SECTION;
  const classes = rowSurfaceClasses(surface);
  const hasHeader = props.header !== undefined;
  const controls = props.header?.controls;
  return {
    isBare: !props.surface && !props.header && !props.footer,
    // Both positions absent means no band — never an empty flex row.
    hasControls: controls?.start !== undefined || controls?.end !== undefined,
    surface,
    cardVariant: rowSurfaceCardVariant(surface),
    classes,
    ui: {
      header: classes.header,
      title: classes.title,
      // A headerless card takes the bare body — `body`'s `pt-0` assumes a
      // header above it (variants.ts `bodyBare`).
      content: hasHeader ? classes.body : classes.bodyBare,
      footer: classes.footer
    }
  } as const;
});
</script>
