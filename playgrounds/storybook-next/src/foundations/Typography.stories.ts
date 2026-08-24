import { typeScale } from "@upmind/tokens";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";
import {
  readLengthPx,
  readToken,
  round1,
  useThemeTick
} from "./foundation-helpers.ts";

/**
 * Upmind UI type is a hand-tuned scale, not a modular one: every step is set
 * by hand on whole pixels with a line box on the spacing grid, growing in
 * increments rather than by a constant ratio, and named for the job it does.
 * Three faces carry the system — a themeable display face for headings, a
 * workhorse sans for product UI, and a mono for identifiers and amounts.
 * Switch themes in the toolbar to see the display face change.
 */
const meta: Meta = {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

/** Specimen rows, large to small (7xl+ are spectacle sizes that overflow). */
const STEP_NAMES = [
  "6xl",
  "5xl",
  "4xl",
  "3xl",
  "2xl",
  "xl",
  "lg",
  "base",
  "sm",
  "xs",
  "2xs"
];

export const Scale: Story = {
  render: () => ({
    setup() {
      const tick = useThemeTick();
      const scale = computed(() => {
        void tick.value;
        // The one live knob: --type-base resizes every step proportionally.
        const basePx = readLengthPx("type-base", 16);
        const base = readToken("type-base") || "1rem";
        return {
          base,
          rows: STEP_NAMES.map(name => {
            const step = typeScale.steps[name]!;
            return {
              name,
              cls: `text-${name}`,
              px: round1(step.px * (basePx / 16)),
              line: round1(step.line * (basePx / 16)),
              role: step.role
            };
          })
        };
      });
      return { scale };
    },
    template: `
      <div class="max-w-4xl space-y-8">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">The type scale</h2>
          <p class="text-sm text-muted">
            Tuned by hand, not computed from a ratio: whole-pixel sizes in growing
            increments (+1 +2 … +6), line boxes on the spacing grid, and a protected
            small end — captions hold 12px, 11px is the floor, nothing renders smaller.
            Each step is named for the job it does. The one live knob is
            <span class="font-mono text-xs">--type-base</span>, which resizes the whole
            scale without bending its shape.
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <span class="rounded-badge bg-neutral-muted px-2.5 py-1 font-mono text-2xs text-neutral-muted-contrast">--type-base: {{ scale.base }}</span>
            <span class="rounded-badge bg-neutral-muted px-2.5 py-1 font-mono text-2xs text-neutral-muted-contrast">increments +1 +2 +2 +2 +2 +4 +6 +6 +12…</span>
          </div>
        </header>
        <div class="divide-y divide-stroke rounded-card border border-stroke bg-surface">
          <div v-for="row in scale.rows" :key="row.name" class="flex items-baseline gap-6 px-5 py-3">
            <div class="w-44 shrink-0">
              <div class="font-mono text-xs font-medium text-display">text-{{ row.name }}</div>
              <div class="font-mono text-2xs text-muted">{{ row.px }} / {{ row.line }}</div>
              <div class="text-2xs text-muted">{{ row.role }}</div>
            </div>
            <p class="type-display min-w-0 text-display" :class="row.cls">Billing, beautifully run</p>
          </div>
        </div>
      </div>
    `
  })
};

export const ThreeFaces: Story = {
  render: () => ({
    setup() {
      const tick = useThemeTick();
      const firstFamily = (token: string) =>
        (readToken(token).split(",")[0] ?? "").replaceAll("'", "").trim();
      const faces = computed(() => {
        void tick.value;
        return {
          displayFamily: firstFamily("font-family-display"),
          displayWeight: readToken("font-display-weight"),
          displayTracking: readToken("font-display-tracking"),
          sansFamily: firstFamily("font-family-sans"),
          monoFamily: firstFamily("font-family-mono")
        };
      });
      return { faces };
    },
    template: `
      <div class="max-w-5xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Display, sans, mono</h2>
          <p class="text-sm text-muted">
            Three faces, three jobs. The display face is the loudest brand lever in the
            system — try Nimbus (Space Grotesk) or Vermilion (Gilda Display)
            in the toolbar and watch only the headings change.
          </p>
        </header>
        <div class="grid gap-4 lg:grid-cols-3">
          <article class="rounded-card border border-stroke bg-surface p-5">
            <div class="font-mono text-2xs text-muted">type-display · var(--font-family-display)</div>
            <h3 class="type-display mt-3 text-3xl text-display">Grow without the busywork</h3>
            <p class="mt-3 text-xs text-muted">
              Headings and hero numbers. Face ({{ faces.displayFamily }}), weight
              ({{ faces.displayWeight }}) and tracking ({{ faces.displayTracking }})
              all come from the theme.
            </p>
          </article>
          <article class="rounded-card border border-stroke bg-surface p-5">
            <div class="font-mono text-2xs text-muted">font-sans · var(--font-family-sans)</div>
            <p class="mt-3 text-base text-body">
              Your March invoice is ready. Atlas Pro Hosting renews on 28 June for
              $24.00 — auto-pay is enabled, nothing to do.
            </p>
            <p class="mt-3 text-xs text-muted">
              Product UI: body copy, forms, tables, navigation. {{ faces.sansFamily }}
              under every brand unless a theme overrides it.
            </p>
          </article>
          <article class="rounded-card border border-stroke bg-surface p-5">
            <div class="font-mono text-2xs text-muted">font-mono · var(--font-family-mono)</div>
            <div class="mt-3 space-y-1 font-mono text-sm text-body">
              <div>INV-2049 · $24.00 USD</div>
              <div>ns1.upmind.com → 185.24.96.10</div>
              <div>TXN 9F2C-11A8-77D3</div>
            </div>
            <p class="mt-3 text-xs text-muted">
              Identifiers, amounts, DNS records — anywhere column alignment carries
              meaning. {{ faces.monoFamily }}.
            </p>
          </article>
        </div>
      </div>
    `
  })
};

export const DisplayUtilities: Story = {
  render: () => ({
    template: `
      <div class="max-w-3xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Display utilities</h2>
          <p class="text-sm text-muted">
            <span class="font-mono text-xs">type-display</span> and
            <span class="font-mono text-xs">type-display-bold</span> apply the theme's
            heading family, weight and tracking — pair them with any size utility.
            Raw h1–h6 elements inherit the display face from base styles; sizes always
            stay explicit.
          </p>
        </header>
        <div class="space-y-6 rounded-card border border-stroke bg-surface p-6">
          <div class="space-y-1">
            <div class="font-mono text-2xs text-muted">type-display text-4xl</div>
            <p class="type-display text-4xl text-display">Welcome back, Priya</p>
          </div>
          <div class="space-y-1">
            <div class="font-mono text-2xs text-muted">type-display-bold text-4xl</div>
            <p class="type-display-bold text-4xl text-display">$1,284.00 due</p>
          </div>
          <div class="space-y-1">
            <div class="font-mono text-2xs text-muted">type-display text-xl + text-sm text-muted</div>
            <p class="type-display text-xl text-display">Domains expiring this month</p>
            <p class="text-sm text-muted">4 domains renew automatically on 1 July.</p>
          </div>
          <div class="space-y-1">
            <div class="font-mono text-2xs text-muted">type-display text-lg text-muted — quiet section label</div>
            <p class="type-display text-lg text-muted">Payment methods</p>
          </div>
        </div>
      </div>
    `
  })
};
