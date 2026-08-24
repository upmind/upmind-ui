import type { Meta, StoryObj } from "@storybook/vue3-vite";

/**
 * Brand surface **textures** — the sanctioned alternative to stock photography
 * in split-screen brand panes and heroes. Instead of imagery, a pane wears the
 * brand's primary colour with grain or a tonal pattern applied.
 *
 * Each `texture-*` is an OVERLAY utility: it sets only `background-image` (one
 * or more layers) and the few size/position/blend properties a pattern needs,
 * and NO background-color. Drop it on a brand-toned surface
 * (`bg-primary text-primary-contrast`) and the surface shows through.
 *
 * Marks are token-driven and theme-correct by construction. Pattern lines and
 * stipple derive from the foreground token —
 * `color-mix(in oklab, var(--primary-contrast) <pct>%, transparent)` at low
 * alpha — and the organic textures pull hue/tone variance from the primary
 * family (`--primary` / `--primary-delta` / `--primary-active` /
 * `--primary-stop`). Both flip per brand and per light/dark mode, so every
 * texture re-skins for free. Film grain is an inline `feTurbulence` SVG. The
 * textures here are static; animated brand surfaces are provided by the
 * `MeshGradient` / `GrainGradient` shader components (Display), not by these
 * utilities. Switch brand/mode in the toolbar to watch them retint.
 *
 * The ten: `texture-grain`, `texture-speckle`, `texture-dots`, `texture-grid`,
 * `texture-diagonal`, `texture-crosshatch`, `texture-rings`, `texture-mesh`,
 * `texture-glow`, `texture-waves`.
 */
const meta: Meta = {
  title: "Foundations/Textures",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

interface TextureSpec {
  /** The full utility class, e.g. `texture-grain`. */
  cls: string;
  /** Display name shown in the chip. */
  name: string;
  /** One-line description of the treatment. */
  blurb: string;
}

const TEXTURES: TextureSpec[] = [
  {
    cls: "texture-grain",
    name: "texture-grain",
    blurb: "Fine, even film grain — the most subtle."
  },
  {
    cls: "texture-speckle",
    name: "texture-speckle",
    blurb: "Sparser, coarser stipple. Grain-forward."
  },
  {
    cls: "texture-dots",
    name: "texture-dots",
    blurb: "A soft polka-dot lattice."
  },
  {
    cls: "texture-grid",
    name: "texture-grid",
    blurb: "A fine blueprint line grid."
  },
  {
    cls: "texture-diagonal",
    name: "texture-diagonal",
    blurb: "Single-direction diagonal hatch."
  },
  {
    cls: "texture-crosshatch",
    name: "texture-crosshatch",
    blurb: "Two opposed diagonal hatches."
  },
  {
    cls: "texture-rings",
    name: "texture-rings",
    blurb: "Concentric corner-offset contour rings."
  },
  {
    cls: "texture-mesh",
    name: "texture-mesh",
    blurb: "Organic multi-blob mesh across the primary family."
  },
  {
    cls: "texture-glow",
    name: "texture-glow",
    blurb: "One large soft off-centre spotlight."
  },
  {
    cls: "texture-waves",
    name: "texture-waves",
    blurb: "Soft horizontal wave bands."
  }
];

export const Gallery: Story = {
  render: () => ({
    setup() {
      return { textures: TEXTURES };
    },
    template: `
      <div class="space-y-8 p-6 sm:p-10">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Brand surface textures</h2>
          <p class="text-sm text-muted">
            Ten tonal treatments for split-screen brand panes and heroes — the
            sanctioned alternative to stock imagery. Each is an overlay over a
            <span class="font-mono text-xs">bg-primary text-primary-contrast</span>
            surface; marks come from the primary intent family, so they re-skin
            per brand and per mode. Switch the toolbar theme to see them retint.
          </p>
        </header>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div
            v-for="t in textures"
            :key="t.cls"
            class="relative flex h-56 flex-col justify-end overflow-hidden rounded-card bg-primary text-primary-contrast shadow-card"
          >
            <div :class="['absolute inset-0', t.cls]" aria-hidden="true"></div>
            <div class="relative m-3 rounded-message bg-surface px-3 py-2 shadow-raised">
              <div class="font-mono text-xs font-medium text-body">{{ t.name }}</div>
              <p class="mt-0.5 text-xs text-muted">{{ t.blurb }}</p>
            </div>
          </div>
        </div>
      </div>
    `
  })
};

/**
 * The real brand-pane composition: a full-height primary surface wearing one
 * texture, with a frosted `bg-mist` caption over it — exactly how a
 * split-screen auth or checkout pane uses these. The texture layer is
 * `aria-hidden`; the caption carries real contrast via the mist surface.
 */
export const BrandPane: Story = {
  render: () => ({
    template: `
      <div class="grid min-h-[32rem] lg:grid-cols-2">
        <div class="relative flex flex-col justify-between overflow-hidden bg-primary p-10 text-primary-contrast">
          <div class="texture-mesh absolute inset-0" aria-hidden="true"></div>
          <div class="relative flex items-center gap-2 text-sm font-medium">
            <span class="inline-block size-2 rounded-full bg-primary-contrast"></span>
            Atlas Cloud
          </div>
          <div class="relative max-w-sm space-y-4">
            <h2 class="type-display text-3xl">Hosting that scales with you.</h2>
            <div class="rounded-card bg-mist p-4 backdrop-blur">
              <p class="text-sm text-body">
                “We moved every client domain across in an afternoon — zero
                downtime, and billing finally lives in one place.”
              </p>
              <p class="mt-2 text-xs text-muted">Priya N. · Founder, Northwind Studio</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-center gap-4 bg-canvas p-10">
          <h1 class="type-display text-2xl text-display">Create your account</h1>
          <p class="text-sm text-muted">
            The pane on the left is a brand-toned surface wearing
            <span class="font-mono text-xs">texture-mesh</span> — no stock photo,
            just the primary family plus token-driven grain. It restyles itself
            for every brand and for dark mode automatically.
          </p>
          <div class="space-y-2">
            <div class="h-9 rounded-field border border-(--border-control) bg-surface shadow-field"></div>
            <div class="h-9 rounded-field border border-(--border-control) bg-surface shadow-field"></div>
            <div class="h-9 rounded-button bg-primary text-primary-contrast shadow-button"></div>
          </div>
        </div>
      </div>
    `
  })
};
