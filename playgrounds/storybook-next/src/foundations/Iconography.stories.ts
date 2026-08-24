import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { themes } from "@upmind/tokens";
import {
  Bell,
  CreditCard,
  Globe,
  RefreshCw,
  Server,
  ShieldCheck
} from "lucide-vue-next";
import { computed } from "vue";
import {
  readToken,
  scopedTokenStyle,
  useThemeTick
} from "./foundation-helpers.ts";

/**
 * Upmind UI icons are lucide-vue-next only, drawn at a theme-controlled stroke:
 * the base layer applies `svg.lucide { stroke-width: var(--icon-stroke) }`,
 * so components NEVER set stroke-width. Size with `size-4` (or `size-3.5`
 * in xs contexts) and color with the text-role utilities — icons inherit
 * `currentColor`. Icon-only interactive elements require an `aria-label`.
 */
const meta: Meta = {
  title: "Foundations/Iconography",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

const SIZES = [
  { cls: "size-3.5", note: "xs contexts (menu shortcuts, 2xs metadata)" },
  { cls: "size-4", note: "the default — buttons, fields, menu items" },
  { cls: "size-5", note: "standalone affordances, empty-state accents" },
  { cls: "size-6", note: "feature spots, large empty states" }
];

export const StrokeToken: Story = {
  render: () => ({
    components: { Bell, CreditCard, Globe, Server, ShieldCheck },
    setup() {
      const tick = useThemeTick();
      const stroke = computed(() => {
        void tick.value;
        return readToken("icon-stroke") || "1.5";
      });
      const brands = themes.map(t => ({
        name: t.name,
        label: t.label,
        stroke: t.light["icon-stroke"] ?? "1.5"
      }));
      return { stroke, brands, sizes: SIZES, scopeStyle: scopedTokenStyle() };
    },
    template: `
      <div class="max-w-5xl space-y-10">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">The stroke token</h2>
          <p class="text-sm text-muted">
            One theme slot draws every icon:
            <span class="font-mono text-xs">svg.lucide { stroke-width: var(--icon-stroke) }</span>
            ships in the base layer, so components never set
            <span class="font-mono text-xs">stroke-width</span> — a brand changes the
            entire icon voice with one number
            (<span class="font-mono text-xs">defineTheme({ iconStroke })</span>).
          </p>
          <div class="pt-1">
            <span class="rounded-badge bg-neutral-muted px-2.5 py-1 font-mono text-2xs text-neutral-muted-contrast">--icon-stroke: {{ stroke }}</span>
          </div>
        </header>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Sizes</h3>
          <p class="max-w-2xl text-2xs text-muted">
            Icons size with <span class="font-mono">size-*</span> utilities and inherit
            <span class="font-mono">currentColor</span> from the text role around them.
          </p>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="s in sizes" :key="s.cls" class="rounded-card border border-stroke bg-surface p-4">
              <div class="flex items-center gap-3 text-body">
                <Server :class="s.cls" aria-hidden="true" />
                <Globe :class="s.cls" aria-hidden="true" />
                <CreditCard :class="s.cls" aria-hidden="true" />
                <ShieldCheck :class="s.cls" aria-hidden="true" />
                <Bell :class="s.cls" aria-hidden="true" />
              </div>
              <div class="mt-3 font-mono text-2xs text-display">{{ s.cls }}</div>
              <div class="text-2xs text-muted">{{ s.note }}</div>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Across brands</h3>
          <p class="max-w-2xl text-2xs text-muted">
            The same icons inside each brand's <span class="font-mono">data-theme</span>
            scope — stroke, text roles and the control accent all re-resolve per scope.
          </p>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="b in brands"
              :key="b.name"
              :data-theme="b.name"
              :style="scopeStyle"
              class="rounded-card border border-stroke bg-canvas p-4"
            >
              <div class="flex items-center gap-3 text-body">
                <Server class="size-5" aria-hidden="true" />
                <Globe class="size-5" aria-hidden="true" />
                <CreditCard class="size-5" aria-hidden="true" />
                <ShieldCheck class="size-5 text-success" aria-hidden="true" />
                <Bell class="size-5 text-control" aria-hidden="true" />
              </div>
              <div class="mt-3 flex items-baseline justify-between gap-2">
                <span class="text-2xs font-medium text-display">{{ b.label }}</span>
                <span class="font-mono text-2xs text-muted">--icon-stroke: {{ b.stroke }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    `
  })
};

export const AccessibleIcons: Story = {
  render: () => ({
    components: { Bell, RefreshCw },
    template: `
      <div class="max-w-3xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">The aria-label rule</h2>
          <p class="text-sm text-muted">
            Icons never speak for themselves. An icon-only interactive element MUST
            carry an <span class="font-mono text-xs">aria-label</span>, and the icon
            itself is <span class="font-mono text-xs">aria-hidden="true"</span>.
            Decorative icons beside visible text are also
            <span class="font-mono text-xs">aria-hidden</span>.
          </p>
        </header>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-card border border-stroke bg-surface p-5">
            <div class="text-2xs font-medium text-success-muted-contrast">Do</div>
            <div class="mt-3 flex items-center gap-3">
              <button
                type="button"
                aria-label="Renew domain"
                class="grid size-9 min-h-[24px] min-w-[24px] cursor-pointer place-items-center rounded-button text-body outline-none transition-colors hover:bg-neutral-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
              >
                <RefreshCw class="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-button px-3 text-sm font-medium text-body outline-none transition-colors hover:bg-neutral-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
              >
                <Bell class="size-4" aria-hidden="true" />
                Notifications
              </button>
            </div>
            <pre tabindex="0" class="mt-4 overflow-x-auto rounded-message bg-canvas p-3 font-mono text-2xs leading-relaxed text-body">&lt;button aria-label="Renew domain"&gt;
  &lt;RefreshCw class="size-4" aria-hidden="true" /&gt;
&lt;/button&gt;</pre>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-5">
            <div class="text-2xs font-medium text-danger-muted-contrast">Don't</div>
            <p class="mt-3 text-xs text-muted">
              An icon-only button with no accessible name is invisible to screen
              readers — and fails this Storybook's a11y gate (it runs at
              <span class="font-mono">error</span> severity).
            </p>
            <pre tabindex="0" class="mt-4 overflow-x-auto rounded-message bg-canvas p-3 font-mono text-2xs leading-relaxed text-muted">&lt;!-- no name, no announcement --&gt;
&lt;button&gt;
  &lt;RefreshCw class="size-4" /&gt;
&lt;/button&gt;</pre>
            <p class="mt-3 text-xs text-muted">
              Also wrong: setting <span class="font-mono">stroke-width</span> on the
              icon — the token owns it.
            </p>
          </div>
        </div>
        <p class="max-w-2xl text-2xs text-muted">
          Pointer targets stay ≥ 24×24 physical px: spacing utilities are
          density-aware and may shrink, so icon-only hit areas use the whitelisted
          <span class="font-mono">min-h-[24px] min-w-[24px]</span> floors.
        </p>
      </div>
    `
  })
};
