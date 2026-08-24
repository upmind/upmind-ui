/**
 * Shared utilities for the Foundations & Theming docs stories.
 *
 * One CSS subtlety drives most of this file: var() references inside a custom
 * property are substituted on the element where that property is DECLARED,
 * not where it is consumed. The token engine re-declares derived tokens
 * (--radius-slot-*, --text-*, --spacing) at every scope boundary —
 * :root, .dark, [data-theme] and [data-tokens] — so subtree overrides work
 * natively. scopedTokenStyle() achieves the same as an inline style record
 * for demo elements where adding a data-tokens attribute isn't convenient;
 * it builds the formulas from the same @upmind/tokens exports, so it cannot
 * drift from the engine.
 */
import { radiusSlots, typeScale } from "@upmind/tokens";
import { onMounted, onUnmounted, ref, type PropType, type Ref } from "vue";

/** Bumps whenever the toolbar switches data-theme or .dark on <html>. */
export function useThemeTick(): Ref<number> {
  const tick = ref(0);
  let observer: MutationObserver | null = null;
  onMounted(() => {
    tick.value++;
    observer = new MutationObserver(() => {
      tick.value++;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"]
    });
  });
  onUnmounted(() => observer?.disconnect());
  return tick;
}

/** Read a resolved CSS custom property from the active theme. */
export function readToken(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
}

/** Read a unitless numeric token (--density, --radius-factor). */
export function readNumberToken(name: string, fallback: number): number {
  const n = Number.parseFloat(readToken(name));
  return Number.isFinite(n) ? n : fallback;
}

/** px value of a length token expressed in rem or px (--type-base). */
export function readLengthPx(name: string, fallbackPx: number): number {
  const raw = readToken(name);
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return fallbackPx;
  return raw.includes("rem") ? n * 16 : n;
}

/**
 * Inline-style record that re-declares every derived token on a subtree so
 * overrides of --radius-factor / --type-base / --density / data-theme take
 * effect inside it. Spread `overrides` last to pin the knobs themselves.
 */
export function scopedTokenStyle(
  overrides: Record<string, string> = {}
): Record<string, string> {
  const style: Record<string, string> = {
    "--spacing": "calc(0.25rem * var(--density, 1))"
  };
  for (const [slot, rem] of Object.entries(radiusSlots)) {
    style[`--radius-slot-${slot}`] =
      `calc(${rem}rem * var(--radius-factor, 1))`;
  }
  for (const [step, def] of Object.entries(typeScale.steps)) {
    style[`--text-${step}`] =
      def.px === 16
        ? "var(--type-base, 1rem)"
        : `calc(var(--type-base, 1rem) * ${def.px / 16})`;
  }
  return { ...style, ...overrides };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Shared hand-rolled specimens
//
// Several Foundations stories show a text field or a menu purely as token
// specimens (radius slots, elevation, brand scopes, states). They share one
// definition here so the recipes — which mirror COMPONENT_SPEC.md and the
// real @upmind/ui variants — can never drift between stories.
// ---------------------------------------------------------------------------

/** The bordered-field recipe (mirrors `inputVariants` in @upmind/ui input). */
export const FIELD_CLASSES = [
  "rounded-field border border-(--border-control) bg-surface text-body shadow-field",
  "outline-none transition-[border-color,box-shadow,opacity] placeholder:text-faint",
  "hover:border-(--border-control-hover)",
  "focus-visible:border-(--border-control-selected) focus-visible:ring-[3px] focus-visible:ring-ring/15",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
].join(" ");

/**
 * A bare input wearing the canonical field recipe. Width comes from the call
 * site (`class="w-44"`); placeholder/aria-label/id/disabled/aria-invalid all
 * fall through to the underlying `<input>`.
 */
export const SpecimenInput = {
  props: {
    size: { type: String as PropType<"sm" | "md">, default: "md" }
  },
  setup() {
    return { fieldClasses: FIELD_CLASSES };
  },
  template: `
    <input
      :class="[fieldClasses, size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm']"
    />
  `
};

export interface SpecimenMenuItem {
  label: string;
  selected?: boolean;
  tone?: "danger";
}

/** Default item set: the invoice actions menu used across the foundations. */
export const MENU_ITEMS: SpecimenMenuItem[] = [
  { label: "View invoice", selected: true },
  { label: "Download PDF" },
  { label: "Cancel service", tone: "danger" }
];

/**
 * A static dropdown-menu specimen on the overlay surface. Pass width and
 * positioning via class; pick the elevation slot the layer calls for.
 */
export const SpecimenMenu = {
  props: {
    items: {
      type: Array as PropType<SpecimenMenuItem[]>,
      default: () => MENU_ITEMS
    },
    elevation: {
      type: String as PropType<"raised" | "overlay">,
      default: "raised"
    }
  },
  template: `
    <div
      class="rounded-overlay border border-stroke bg-surface-raised p-1.5"
      :class="elevation === 'overlay' ? 'shadow-overlay' : 'shadow-raised'"
    >
      <div
        v-for="item in items"
        :key="item.label"
        class="rounded-control px-2 py-1.5 text-2xs"
        :class="item.selected
          ? 'bg-(--bg-control-selected) text-(--text-control-selected)'
          : item.tone === 'danger' ? 'text-danger-muted-contrast' : 'text-body'"
      >{{ item.label }}</div>
    </div>
  `
};
