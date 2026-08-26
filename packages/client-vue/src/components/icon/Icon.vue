<template>
  <!-- Mapped UI glyph: the lucide component renders the <svg> itself -->
  <component
    :is="glyph"
    v-if="glyph"
    role="img"
    :aria-label="ariaLabel"
    :aria-checked="props.checked"
    :class="
      cn(
        'inline-block shrink-0 transition-transform duration-200 aria-checked:rotate-180',
        ICON_SIZE[size] ?? ICON_SIZE.auto,
        props.class
      )
    "
  />

  <!-- Asset SVG from the brand's registered pack, plus flags and provider logos -->
  <i
    v-else-if="svg"
    role="img"
    :aria-label="ariaLabel"
    :aria-checked="props.checked"
    class="icon inline-block shrink-0 transition-transform duration-200 aria-checked:rotate-180"
    :class="
      cn(ICON_SIZE[size] ?? ICON_SIZE.auto, '[&>svg]:size-full', props.class)
    "
    v-html="svg"
  />

  <!-- Visible fallback — only when a name was actually given but didn't
       resolve (the dev-warning case). An absent/empty icon renders nothing,
       so optional-icon consumers (e.g. an icon-less breadcrumb crumb) don't
       get a stray help glyph. -->
  <component
    :is="FALLBACK_ICON"
    v-else-if="name || fallbackName"
    role="img"
    :aria-label="ariaLabel"
    :class="
      cn(
        'text-muted inline-block shrink-0',
        ICON_SIZE[size] ?? ICON_SIZE.auto,
        props.class
      )
    "
  />
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import { computed, ref, watchEffect } from "vue";
import { FALLBACK_ICON, resolveLucideIcon } from "./icon-map";
import { hasIcon, iconVariant, loadIcon } from "./iconLoader";
import { isString } from "lodash-es";
import type { IconProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<IconProps>(), {
  size: "auto",
  class: ""
});

const emit = defineEmits<{
  error: [Error];
}>();

// --- icon size scale (one map; literal classes so Tailwind's scan finds them) -
// Both paths share it: the lucide <svg> takes the class directly; the asset <i>
// takes the same class and the inner svg just fills it (see the template). A
// monotonic, icon-appropriate scale. `auto` = no size, so a container's
// `[&_svg]:size-*` (Button/Link) sizes the glyph, else lucide's intrinsic 24px.
const ICON_SIZE: Record<string, string> = {
  auto: "",
  "2xs": "size-3",
  xs: "size-4",
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
  xl: "size-10",
  "2xl": "size-12",
  "3xl": "size-16"
};

const nameOf = (value?: IconProps["icon"]): string => {
  if (!value) return "";
  return isString(value) ? value : (value.name ?? "");
};

const name = computed(() => nameOf(props.icon));
const fallbackName = computed(() => nameOf(props.fallback));
const ariaLabel = computed(() => `${name.value || "unknown"} icon`);

// The brand's icon pack, when the host app has registered one, is the whole
// point of the `iconVariant` setting — a brand picks Line/Solid/Duotone and
// every glyph follows. So an asset that can serve this name wins; the lucide
// map covers what the packs don't have, and is the only path for hosts that
// register no assets at all.
const variant = computed(() => props.variant || iconVariant.value);

const hasAsset = computed(() => hasIcon(name.value, variant.value));

const glyph = computed(() => {
  if (hasAsset.value) return undefined;
  return resolveLucideIcon(name.value) ?? resolveLucideIcon(fallbackName.value);
});

const svg = ref<string | undefined>(undefined);

watchEffect(async () => {
  if (glyph.value) {
    svg.value = undefined;
    return;
  }

  try {
    let result = await loadIcon(props.icon, { variant: variant.value });
    if (!result && props.fallback) {
      result = await loadIcon(props.fallback, { variant: variant.value });
    }
    svg.value = result;

    // Nothing resolved anywhere — the visible fallback renders; warn in dev
    // so the missing name surfaces and can be added to the lucide map.
    if (!result && name.value && import.meta.env.DEV) {
      console.warn(
        `[Icon] "${name.value}" is neither in the lucide name-map nor the registered SVG assets — rendering the fallback glyph.`
      );
    }
  } catch (e) {
    emit("error", e as Error);
    svg.value = undefined;
  }
});
</script>
