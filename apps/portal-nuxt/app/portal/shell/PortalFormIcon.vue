<template>
  <component :is="glyph" v-if="glyph" :class="meta.sizeClass" />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalFormIcon
 * @description The glyph component the form engine renders wherever a schema
 * or a uischema option names an icon (`provideFormIcon`, `@upmind/ui`
 * `src/form/lib/form-icon.ts`). The name it is handed is an APP-level name,
 * and the portal's name-map is lucide's: the name is PascalCased, looked up
 * there, and an unresolvable one renders NOTHING rather than throwing — the
 * engine's five call sites rely on that.
 *
 * Attributes inherit (no `inheritAttrs: false`), so `class` falls through to
 * the root element — the phone renderer sizes its country flags that way —
 * and the field's tooltip trigger gets its three pointer listeners. The house
 * size is withheld when the caller brought its own class, because Vue's
 * fallthrough CONCATENATES classes rather than resolving the conflict.
 */
import * as lucide from "lucide-vue-next";
import { computed, useAttrs } from "vue";
import { camelCase, get, upperFirst } from "lodash-es";
import type { PortalFormIconProps } from "./types";
import type { Component } from "vue";

defineOptions({ name: "PortalFormIcon" });

const props = defineProps<PortalFormIconProps>();
const attrs = useAttrs();

/** The engine's standalone glyphs ask for `xs`; a parent-sized one names none. */
const ICON_SIZE_CLASS: Readonly<Record<string, string>> = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
  lg: "size-6"
};

/** The name to look up — the engine passes a bare string or a `{ name }` bag. */
function iconName(icon: PortalFormIconProps["icon"]): string {
  if (typeof icon === "string") return icon;
  return icon?.name ?? "";
}

const meta = computed(() => {
  const isSizedByCaller = attrs["class"] !== undefined;
  if (isSizedByCaller) return { sizeClass: undefined };
  return { sizeClass: ICON_SIZE_CLASS[props.size ?? "sm"] };
});

/** A name the icon set does not carry is nothing to draw, never a throw. */
const glyph = computed<Component | undefined>(() => {
  const name = iconName(props.icon);
  if (name === "") return undefined;
  return get(lucide, upperFirst(camelCase(name)));
});
</script>
