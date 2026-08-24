import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  RAMP_STEPS,
  bestContrast,
  chromaticAnchors,
  ramps,
  semanticDescriptions,
  type RampName
} from "@upmind/tokens";
import { computed } from "vue";
import { readToken, useThemeTick } from "./foundation-helpers.ts";

/**
 * The Upmind UI color system in three layers: primitive OKLCH ramps (raw
 * material), semantic tokens (meaning — what applications and components
 * use), and the canonical intent pairings that keep every combination
 * WCAG-checked. Everything below the primitive ramps renders through live
 * CSS variables — switch the theme or mode in the toolbar and watch the
 * entire vocabulary re-resolve.
 */
const meta: Meta = {
  title: "Foundations/Colors",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

const DARK_INK = ramps.gray[950];
const RAMP_ORDER: RampName[] = [
  "gray",
  "blue",
  "purple",
  "coral",
  "yellow",
  "green",
  "teal",
  "orange",
  "pink"
];

const rampRows = RAMP_ORDER.map(name => ({
  name,
  note:
    name === "gray"
      ? "hand-tuned, faintly violet-cool"
      : `generated from anchor ${chromaticAnchors[name]}`,
  swatches: RAMP_STEPS.map(step => ({
    step,
    hex: ramps[name][step],
    ink: bestContrast(ramps[name][step], ["#FFFFFF", DARK_INK])
  }))
}));

export const PrimitiveRamps: Story = {
  parameters: {
    a11y: {
      // Palette specimen: every raw Layer-0 ramp step renders with its hex
      // label, and mid-ramp steps are sub-AA against any ink by definition.
      // Components never consume primitives — the semantic layer they do use
      // is contrast-checked in @upmind/tokens. Every other axe rule still
      // runs at error severity.
      config: { rules: [{ id: "color-contrast", enabled: false }] }
    }
  },
  render: () => ({
    setup() {
      return { rampRows };
    },
    template: `
      <div class="max-w-5xl space-y-8">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Primitive ramps</h2>
          <p class="text-sm text-muted">
            Layer 0 — eleven-step ramps derived in OKLCH from a single anchor per hue,
            tuned so every hue lands on the same perceptual lightness targets.
            Primitives are theme-independent raw material: applications never consume
            them directly, the semantic layer does.
          </p>
        </header>
        <section v-for="ramp in rampRows" :key="ramp.name" class="space-y-2">
          <div class="flex flex-wrap items-baseline gap-x-2">
            <h3 class="text-sm font-medium text-display">{{ ramp.name }}</h3>
            <span class="font-mono text-2xs text-muted">{{ ramp.note }}</span>
          </div>
          <div class="grid grid-cols-11 overflow-hidden rounded-card border border-stroke">
            <div
              v-for="s in ramp.swatches"
              :key="s.step"
              class="flex h-16 flex-col justify-between px-1.5 py-1.5"
              :style="{ backgroundColor: s.hex, color: s.ink }"
            >
              <span class="text-2xs font-semibold">{{ s.step }}</span>
              <span class="font-mono text-2xs tracking-tight opacity-80">{{ s.hex }}</span>
            </div>
          </div>
        </section>
      </div>
    `
  })
};

const SURFACE_TOKENS = [
  "canvas",
  "canvas-stop",
  "surface",
  "surface-raised",
  "skeleton",
  "mist",
  "overlay",
  "overlay-contrast",
  "stroke",
  "stroke-delta"
];

const TEXT_TOKENS = ["display", "body", "muted", "faint"];

const INTENT_NAMES = [
  "primary",
  "secondary",
  "neutral",
  "promo",
  "danger",
  "warning",
  "success",
  "info"
];

const INTENT_FACETS = [
  { suffix: "", label: "default" },
  { suffix: "-stop", label: "stop" },
  { suffix: "-delta", label: "delta" },
  { suffix: "-contrast", label: "contrast" },
  { suffix: "-muted", label: "muted" },
  { suffix: "-muted-delta", label: "muted-delta" },
  { suffix: "-muted-contrast", label: "muted-contrast" }
];

const CONTROL_TOKENS: Array<{ name: string; description: string }> = [
  { name: "control", description: semanticDescriptions["control"] ?? "" },
  {
    name: "control-delta",
    description: "Hover/active shift of the control accent."
  },
  {
    name: "control-contrast",
    description: "Glyph color on a checked control."
  },
  { name: "control-muted", description: "Selected row / option background." },
  {
    name: "control-muted-contrast",
    description: "Text on selected rows and options."
  },
  { name: "control-stroke", description: "Field and control resting border." },
  {
    name: "control-stroke-delta",
    description: "Field and control hover border."
  },
  { name: "ring", description: semanticDescriptions["ring"] ?? "" }
];

export const SemanticTokens: Story = {
  parameters: {
    a11y: {
      // Token reference: the text-role specimens paint the literal tokens,
      // including --faint (placeholder/disabled ink that is sub-AA by
      // design). Every other axe rule still runs at error severity.
      config: { rules: [{ id: "color-contrast", enabled: false }] }
    }
  },
  render: () => ({
    setup() {
      const tick = useThemeTick();
      const describe = (name: string) => semanticDescriptions[name] ?? "";
      const surfaces = computed(() => {
        void tick.value;
        return SURFACE_TOKENS.map(name => ({
          name,
          cssVar: `var(--${name})`,
          value: readToken(name),
          description: describe(name)
        }));
      });
      const textRoles = computed(() => {
        void tick.value;
        return TEXT_TOKENS.map(name => ({
          name,
          cssVar: `var(--${name})`,
          value: readToken(name),
          description: describe(name)
        }));
      });
      const intents = computed(() => {
        void tick.value;
        return INTENT_NAMES.map(name => ({
          name,
          description: describe(name),
          facets: INTENT_FACETS.map(f => ({
            token: `${name}${f.suffix}`,
            label: f.label,
            cssVar: `var(--${name}${f.suffix})`,
            value: readToken(`${name}${f.suffix}`)
          }))
        }));
      });
      const controls = computed(() => {
        void tick.value;
        return CONTROL_TOKENS.map(t => ({
          ...t,
          cssVar: `var(--${t.name})`,
          value: readToken(t.name)
        }));
      });
      return { surfaces, textRoles, intents, controls };
    },
    template: `
      <div class="max-w-5xl space-y-10">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Semantic tokens</h2>
          <p class="text-sm text-muted">
            Layer 1 — meaning, not color. Every chip below paints with a live
            <span class="font-mono text-xs">var(--token)</span>, so the values shown
            re-resolve when you switch the brand or mode in the toolbar. This is the
            only color vocabulary components are allowed to use.
          </p>
        </header>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Surfaces &amp; strokes</h3>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="t in surfaces" :key="t.name" class="flex items-start gap-3 rounded-card border border-stroke bg-surface p-3">
              <span class="mt-0.5 size-9 shrink-0 rounded-control border border-stroke" :style="{ background: t.cssVar }"></span>
              <span class="min-w-0">
                <span class="block truncate font-mono text-xs font-medium text-display">--{{ t.name }}</span>
                <span class="block font-mono text-2xs text-muted">{{ t.value }}</span>
                <span class="mt-1 block text-2xs text-muted">{{ t.description }}</span>
              </span>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Text roles</h3>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="t in textRoles" :key="t.name" class="flex items-start gap-3 rounded-card border border-stroke bg-surface p-3">
              <span class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-control border border-stroke bg-canvas text-sm font-semibold" :style="{ color: t.cssVar }">Ag</span>
              <span class="min-w-0">
                <span class="block truncate font-mono text-xs font-medium text-display">--{{ t.name }}</span>
                <span class="block font-mono text-2xs text-muted">{{ t.value }}</span>
                <span class="mt-1 block text-2xs text-muted">{{ t.description }}</span>
              </span>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Intents — 8 × 7 facets</h3>
          <p class="max-w-2xl text-2xs text-muted">
            Each intent resolves seven facets: the surface itself, its gradient stop,
            a hover delta, the WCAG-checked contrast label, and a soft muted trio for
            badges and tints.
          </p>
          <div class="grid gap-3 lg:grid-cols-2">
            <div v-for="intent in intents" :key="intent.name" class="rounded-card border border-stroke bg-surface p-3">
              <div class="flex flex-wrap items-baseline gap-x-2">
                <span class="font-mono text-xs font-medium text-display">--{{ intent.name }}</span>
                <span class="text-2xs text-muted">{{ intent.description }}</span>
              </div>
              <div class="mt-2.5 grid grid-cols-7 gap-1.5">
                <div v-for="f in intent.facets" :key="f.token" class="space-y-1">
                  <div class="h-8 rounded-control border border-stroke" :style="{ background: f.cssVar }" :title="'--' + f.token + ': ' + f.value"></div>
                  <div class="truncate text-center font-mono text-2xs text-muted" :title="f.label">{{ f.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Form control accent &amp; focus</h3>
          <p class="max-w-2xl text-2xs text-muted">
            Deliberately decoupled from primary, so brands with near-black buttons keep
            recognisable checkboxes, switches and focus rings.
          </p>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="t in controls" :key="t.name" class="flex items-start gap-3 rounded-card border border-stroke bg-surface p-3">
              <span class="mt-0.5 size-9 shrink-0 rounded-control border border-stroke" :style="{ background: t.cssVar }"></span>
              <span class="min-w-0">
                <span class="block truncate font-mono text-xs font-medium text-display">--{{ t.name }}</span>
                <span class="block font-mono text-2xs text-muted">{{ t.value }}</span>
                <span class="mt-1 block text-2xs text-muted">{{ t.description }}</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    `
  })
};

const PAIRINGS = [
  {
    intent: "primary",
    solid: "bg-primary text-primary-contrast hover:bg-primary-delta",
    muted:
      "bg-primary-muted text-primary-muted-contrast hover:bg-primary-muted-delta",
    solidLabel: "Pay invoice",
    mutedLabel: "Brand accent",
    note: semanticDescriptions["primary"] ?? ""
  },
  {
    intent: "secondary",
    solid: "bg-secondary text-secondary-contrast hover:bg-secondary-delta",
    muted:
      "bg-secondary-muted text-secondary-muted-contrast hover:bg-secondary-muted-delta",
    solidLabel: "Download PDF",
    mutedLabel: "Quiet companion",
    note: semanticDescriptions["secondary"] ?? ""
  },
  {
    intent: "neutral",
    solid: "bg-neutral text-neutral-contrast hover:bg-neutral-delta",
    muted:
      "bg-neutral-muted text-neutral-muted-contrast hover:bg-neutral-muted-delta",
    solidLabel: "Manage service",
    mutedLabel: "Chrome accent",
    note: semanticDescriptions["neutral"] ?? ""
  },
  {
    intent: "promo",
    solid: "bg-promo text-promo-contrast hover:bg-promo-delta",
    muted:
      "bg-promo-muted text-promo-muted-contrast hover:bg-promo-muted-delta",
    solidLabel: "Upgrade plan",
    mutedLabel: "20% off renewals",
    note: semanticDescriptions["promo"] ?? ""
  },
  {
    intent: "danger",
    solid: "bg-danger text-danger-contrast hover:bg-danger-delta",
    muted:
      "bg-danger-muted text-danger-muted-contrast hover:bg-danger-muted-delta",
    solidLabel: "Cancel service",
    mutedLabel: "Overdue",
    note: semanticDescriptions["danger"] ?? ""
  },
  {
    intent: "warning",
    solid: "bg-warning text-warning-contrast hover:bg-warning-delta",
    muted:
      "bg-warning-muted text-warning-muted-contrast hover:bg-warning-muted-delta",
    solidLabel: "Domain expiring",
    mutedLabel: "Due soon",
    note: semanticDescriptions["warning"] ?? ""
  },
  {
    intent: "success",
    solid: "bg-success text-success-contrast hover:bg-success-delta",
    muted:
      "bg-success-muted text-success-muted-contrast hover:bg-success-muted-delta",
    solidLabel: "Invoice paid",
    mutedLabel: "Active",
    note: semanticDescriptions["success"] ?? ""
  },
  {
    intent: "info",
    solid: "bg-info text-info-contrast hover:bg-info-delta",
    muted: "bg-info-muted text-info-muted-contrast hover:bg-info-muted-delta",
    solidLabel: "Nameservers updated",
    mutedLabel: "Auto-renew on",
    note: semanticDescriptions["info"] ?? ""
  }
];

export const IntentPairings: Story = {
  render: () => ({
    setup() {
      return { pairs: PAIRINGS };
    },
    template: `
      <div class="max-w-3xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Intent pairings</h2>
          <p class="text-sm text-muted">
            The canonical combinations: <span class="font-mono text-xs">bg-x text-x-contrast hover:bg-x-delta</span>
            for solid surfaces, <span class="font-mono text-xs">bg-x-muted text-x-muted-contrast</span> for soft
            tints. The engine guarantees the contrast facet passes WCAG against its
            surface in both modes — hover the chips to see the delta facet.
          </p>
        </header>
        <div class="space-y-3">
          <div v-for="p in pairs" :key="p.intent" class="flex flex-wrap items-center gap-3">
            <span class="w-24 shrink-0 font-mono text-xs text-muted">{{ p.intent }}</span>
            <button
              type="button"
              class="inline-flex h-9 cursor-pointer items-center rounded-button px-4 text-sm font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
              :class="p.solid"
            >{{ p.solidLabel }}</button>
            <span class="inline-flex items-center rounded-badge px-2.5 py-1 text-xs font-medium transition-colors" :class="p.muted">{{ p.mutedLabel }}</span>
            <span class="hidden text-2xs text-muted lg:inline">{{ p.note }}</span>
          </div>
        </div>
      </div>
    `
  })
};
