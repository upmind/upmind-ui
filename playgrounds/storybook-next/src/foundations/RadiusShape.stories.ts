import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "@upmind/ui/components/button/index.ts";
import { radiusSlots } from "@upmind/tokens";
import { Check } from "lucide-vue-next";
import { computed } from "vue";
import {
  readNumberToken,
  round1,
  scopedTokenStyle,
  SpecimenInput,
  SpecimenMenu,
  useThemeTick
} from "./foundation-helpers.ts";

/**
 * Shape in Upmind UI is a system of radius *slots* — one per component family
 * (button, control, field, badge, card, message, image, overlay) — all
 * multiplied by a single `--radius-factor`. A brand sharpens or softens the
 * entire product with one number: Vermilion ships 0.4 (near-square), Coastal
 * 1.75 (very soft). Components never use `rounded-md`; they use their slot.
 */
const meta: Meta = {
  title: "Foundations/Radius & Shape",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

export const RadiusSlots: Story = {
  render: () => ({
    components: { Button, Check, SpecimenInput, SpecimenMenu },
    setup() {
      const tick = useThemeTick();
      const slots = computed(() => {
        void tick.value;
        const factor = readNumberToken("radius-factor", 1);
        const label = (slot: keyof typeof radiusSlots) => {
          const rem = radiusSlots[slot];
          return `${rem}rem × ${factor} = ${round1(rem * 16 * factor)}px`;
        };
        return {
          factor,
          button: label("button"),
          control: label("control"),
          field: label("field"),
          badge: label("badge"),
          card: label("card"),
          message: label("message"),
          image: label("image"),
          overlay: label("overlay")
        };
      });
      return { slots };
    },
    template: `
      <div class="max-w-5xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Radius slots</h2>
          <p class="text-sm text-muted">
            Each component family rounds through its own slot —
            <span class="font-mono text-xs">rounded-button</span>,
            <span class="font-mono text-xs">rounded-card</span>… — and every slot is
            <span class="font-mono text-xs">calc(base × var(--radius-factor))</span>.
            This brand ships <span class="font-mono text-xs">--radius-factor: {{ slots.factor }}</span>;
            switch themes in the toolbar and every specimen reshapes at once.
          </p>
        </header>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-button</div>
            <div class="font-mono text-2xs text-muted">{{ slots.button }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center rounded-control bg-canvas p-4">
              <Button size="sm">Renew domain</Button>
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-control</div>
            <div class="font-mono text-2xs text-muted">{{ slots.control }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center gap-2 rounded-control bg-canvas p-4">
              <span class="grid size-6 place-items-center rounded-control bg-(--bg-control-checked) text-(--bg-control-checked-contrast)">
                <Check class="size-4" aria-hidden="true" />
              </span>
              <span class="size-6 rounded-control border border-(--border-control) bg-(--bg-control-surface)"></span>
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-field</div>
            <div class="font-mono text-2xs text-muted">{{ slots.field }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center rounded-control bg-canvas p-4">
              <SpecimenInput class="w-44" placeholder="Search invoices…" aria-label="Search invoices" />
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-badge</div>
            <div class="font-mono text-2xs text-muted">{{ slots.badge }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center gap-2 rounded-control bg-canvas p-4">
              <span class="rounded-badge bg-success-muted px-2.5 py-1 text-xs font-medium text-success-muted-contrast">Active</span>
              <span class="rounded-badge bg-danger-muted px-2.5 py-1 text-xs font-medium text-danger-muted-contrast">Overdue</span>
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-card</div>
            <div class="font-mono text-2xs text-muted">{{ slots.card }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center rounded-control bg-canvas p-4">
              <div class="w-44 rounded-card border border-stroke bg-surface p-3 shadow-card">
                <div class="text-xs font-medium text-display">Atlas Pro Hosting</div>
                <div class="mt-1 text-2xs text-muted">Renews 28 June · $24/mo</div>
              </div>
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-message</div>
            <div class="font-mono text-2xs text-muted">{{ slots.message }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center rounded-control bg-canvas p-4">
              <div class="w-44 rounded-message bg-info-muted px-3 py-2 text-2xs text-info-muted-contrast">
                Your invoice is ready to download.
              </div>
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-image</div>
            <div class="font-mono text-2xs text-muted">{{ slots.image }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center rounded-control bg-canvas p-4">
              <div class="h-20 w-32 rounded-image bg-linear-to-br from-primary to-promo"></div>
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <div class="font-mono text-xs font-medium text-display">rounded-overlay</div>
            <div class="font-mono text-2xs text-muted">{{ slots.overlay }}</div>
            <div class="mt-3 flex min-h-24 items-center justify-center rounded-control bg-canvas p-4">
              <SpecimenMenu class="w-40" elevation="overlay" />
            </div>
          </div>
        </div>
      </div>
    `
  })
};

const FACTORS = ["0", "0.5", "1", "1.5", "2"];

export const RadiusFactor: Story = {
  render: () => ({
    components: { Button, SpecimenInput },
    setup() {
      const panels = FACTORS.map(factor => ({
        factor,
        style: scopedTokenStyle({ "--radius-factor": factor })
      }));
      return { panels };
    },
    template: `
      <div class="max-w-6xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">One factor, every shape</h2>
          <p class="text-sm text-muted">
            The same card with <span class="font-mono text-xs">--radius-factor</span>
            pinned at five values. Card, field, buttons and badge all reshape in
            proportion because each consumes its slot, never a hard-coded radius.
            0 is the Vermilion end of the dial, 2 is pillowy.
          </p>
        </header>
        <div class="flex flex-wrap items-start gap-5">
          <div v-for="p in panels" :key="p.factor" class="space-y-2">
            <div :style="p.style" class="w-56 rounded-card border border-stroke bg-surface p-4 shadow-card">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-medium text-display">upmind.dev</h3>
                <span class="rounded-badge bg-success-muted px-2 py-0.5 text-2xs font-medium text-success-muted-contrast">Active</span>
              </div>
              <p class="mt-1 text-2xs text-muted">Domain · renews 12 Aug</p>
              <SpecimenInput
                size="sm"
                class="mt-3 w-full"
                placeholder="Add a DNS record"
                aria-label="Add a DNS record"
              />
              <div class="mt-3 flex gap-2">
                <Button size="xs">Renew</Button>
                <Button size="xs" variant="secondary">Transfer</Button>
              </div>
            </div>
            <div class="text-center font-mono text-2xs text-muted">--radius-factor: {{ p.factor }}</div>
          </div>
        </div>
      </div>
    `
  })
};
