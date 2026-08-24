import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "@upmind/ui/components/button/index.ts";
import { computed } from "vue";
import {
  readNumberToken,
  round1,
  scopedTokenStyle,
  useThemeTick
} from "./foundation-helpers.ts";

/**
 * Spacing in Upmind UI is density-aware: the Tailwind spacing unit is
 * `calc(0.25rem × var(--density))`, so one theme token compresses or relaxes
 * every padding, gap and control height in the system — type sizes stay
 * untouched. Control heights follow the Button scale: h-7/8/9/10/12 for
 * xs/sm/md/lg/xl.
 */
const meta: Meta = {
  title: "Foundations/Spacing & Density",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

const SPACING_STEPS = [
  { token: "0.5", cls: "w-0.5", n: 0.5 },
  { token: "1", cls: "w-1", n: 1 },
  { token: "1.5", cls: "w-1.5", n: 1.5 },
  { token: "2", cls: "w-2", n: 2 },
  { token: "3", cls: "w-3", n: 3 },
  { token: "4", cls: "w-4", n: 4 },
  { token: "6", cls: "w-6", n: 6 },
  { token: "8", cls: "w-8", n: 8 },
  { token: "10", cls: "w-10", n: 10 },
  { token: "12", cls: "w-12", n: 12 },
  { token: "16", cls: "w-16", n: 16 },
  { token: "24", cls: "w-24", n: 24 }
];

export const SpacingScale: Story = {
  render: () => ({
    setup() {
      const tick = useThemeTick();
      const scale = computed(() => {
        void tick.value;
        const density = readNumberToken("density", 1);
        return {
          density,
          rows: SPACING_STEPS.map(s => ({
            ...s,
            px: round1(4 * s.n * density)
          }))
        };
      });
      return { scale };
    },
    template: `
      <div class="max-w-3xl space-y-8">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Spacing scale</h2>
          <p class="text-sm text-muted">
            Standard Tailwind steps on a live unit:
            <span class="font-mono text-xs">--spacing: calc(0.25rem × var(--density))</span>.
            The px values below are computed from the active theme's density token.
          </p>
          <div class="pt-1">
            <span class="rounded-badge bg-neutral-muted px-2.5 py-1 font-mono text-2xs text-neutral-muted-contrast">--density: {{ scale.density }}</span>
          </div>
        </header>
        <div class="space-y-2.5">
          <div v-for="s in scale.rows" :key="s.token" class="flex items-center gap-4">
            <span class="w-8 shrink-0 text-right font-mono text-xs text-muted">{{ s.token }}</span>
            <div class="h-4 shrink-0 rounded-full bg-primary" :class="s.cls"></div>
            <span class="font-mono text-2xs text-muted">{{ s.px }}px</span>
          </div>
        </div>
      </div>
    `
  })
};

const DENSITY_PANELS = [
  { factor: "0.85", label: "Compact — admin tables" },
  { factor: "1", label: "Default" },
  { factor: "1.15", label: "Comfortable — customer portal" }
];

const SERVICES = [
  { name: "Atlas Pro Hosting", price: "$24.00/mo" },
  { name: "upmind.dev", price: "$14.50/yr" },
  { name: "Wildcard SSL", price: "$89.00/yr" }
];

export const Density: Story = {
  render: () => ({
    components: { Button },
    setup() {
      const panels = DENSITY_PANELS.map(p => ({
        ...p,
        style: scopedTokenStyle({ "--density": p.factor })
      }));
      return { panels, services: SERVICES };
    },
    template: `
      <div class="max-w-5xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Density</h2>
          <p class="text-sm text-muted">
            The same panel rendered three times — identical markup, only
            <span class="font-mono text-xs">--density</span> differs. Padding, gaps,
            row heights and the button all compress together; the type scale is
            deliberately unaffected.
          </p>
        </header>
        <div class="flex flex-wrap items-start gap-6">
          <div v-for="p in panels" :key="p.factor" class="space-y-2">
            <div :style="p.style" class="w-72 rounded-card border border-stroke bg-surface p-4 shadow-card">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-medium text-display">Services renewing</h3>
                <span class="rounded-badge bg-warning-muted px-2 py-0.5 text-2xs font-medium text-warning-muted-contrast">3 due</span>
              </div>
              <ul class="mt-3 space-y-2">
                <li v-for="svc in services" :key="svc.name" class="flex items-center justify-between gap-3 rounded-control bg-canvas px-3 py-2">
                  <span class="text-xs text-body">{{ svc.name }}</span>
                  <span class="font-mono text-2xs text-muted">{{ svc.price }}</span>
                </li>
              </ul>
              <div class="mt-3">
                <Button size="sm" block>Renew all</Button>
              </div>
            </div>
            <div class="text-center font-mono text-2xs text-muted">--density: {{ p.factor }} · {{ p.label }}</div>
          </div>
        </div>
      </div>
    `
  })
};

const HEIGHTS = [
  { size: "xs", cls: "h-7", n: 7 },
  { size: "sm", cls: "h-8", n: 8 },
  { size: "md", cls: "h-9", n: 9 },
  { size: "lg", cls: "h-10", n: 10 },
  { size: "xl", cls: "h-12", n: 12 }
];

export const ControlHeights: Story = {
  render: () => ({
    components: { Button },
    setup() {
      const tick = useThemeTick();
      const rows = computed(() => {
        void tick.value;
        const density = readNumberToken("density", 1);
        return HEIGHTS.map(h => ({
          ...h,
          px: round1(4 * h.n * density)
        }));
      });
      return { rows };
    },
    template: `
      <div class="max-w-4xl space-y-8">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Control heights</h2>
          <p class="text-sm text-muted">
            Interactive controls share one height scale —
            <span class="font-mono text-xs">h-7 / h-8 / h-9 / h-10 / h-12</span> for
            xs / sm / md / lg / xl. Fields default to md (h-9) so a button beside an
            input always lines up. Heights ride the spacing unit, so density scales
            them too.
          </p>
        </header>
        <div class="flex flex-wrap items-end gap-5">
          <div v-for="row in rows" :key="row.size" class="flex flex-col items-stretch gap-2">
            <Button :size="row.size">Add domain</Button>
            <div
              class="flex w-44 items-center rounded-field border border-(--border-control) bg-surface px-3 text-xs text-muted"
              :class="row.cls"
            >yourdomain.com</div>
            <div class="text-center font-mono text-2xs text-muted">{{ row.size }} · {{ row.cls }} · {{ row.px }}px</div>
          </div>
        </div>
      </div>
    `
  })
};
