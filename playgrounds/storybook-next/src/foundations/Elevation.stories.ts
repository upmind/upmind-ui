import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "@upmind/ui/components/button/index.ts";
import { SpecimenMenu, type SpecimenMenuItem } from "./foundation-helpers.ts";

/**
 * Three elevation slots and nothing else: `shadow-card` for resting
 * surfaces, `shadow-raised` for things that float above them (menus, drag
 * previews), `shadow-overlay` for the topmost layer (dialogs, command
 * palettes). The values are theme tokens — dark mode swaps them for deeper,
 * softer shadows automatically.
 */
const meta: Meta = {
  title: "Foundations/Elevation",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

export const Shadows: Story = {
  render: () => ({
    template: `
      <div class="max-w-5xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Elevation</h2>
          <p class="text-sm text-muted">
            Specimens sit on the canvas exactly as they would in product. Toggle dark
            mode in the toolbar — the slots resolve to
            <span class="font-mono text-xs">--elevation-card / -raised / -overlay</span>
            per mode, so components never tune shadows themselves.
          </p>
        </header>
        <div class="grid gap-6 rounded-card bg-canvas py-2 sm:grid-cols-3">
          <div class="space-y-2">
            <div class="h-40 rounded-card bg-surface p-4 shadow-card">
              <div class="font-mono text-xs font-medium text-display">shadow-card</div>
              <p class="mt-2 text-2xs text-muted">
                Resting surfaces: cards, list rows, invoice summaries, stat tiles.
              </p>
            </div>
            <div class="text-center font-mono text-2xs text-muted">var(--elevation-card)</div>
          </div>
          <div class="space-y-2">
            <div class="h-40 rounded-card bg-surface p-4 shadow-raised">
              <div class="font-mono text-xs font-medium text-display">shadow-raised</div>
              <p class="mt-2 text-2xs text-muted">
                Floating above content: dropdown menus, hover lifts, drag previews.
              </p>
            </div>
            <div class="text-center font-mono text-2xs text-muted">var(--elevation-raised)</div>
          </div>
          <div class="space-y-2">
            <div class="h-40 rounded-overlay bg-surface p-4 shadow-overlay">
              <div class="font-mono text-xs font-medium text-display">shadow-overlay</div>
              <p class="mt-2 text-2xs text-muted">
                The topmost layer: dialogs, command palettes, sheets and drawers.
              </p>
            </div>
            <div class="text-center font-mono text-2xs text-muted">var(--elevation-overlay)</div>
          </div>
        </div>
      </div>
    `
  })
};

const INVOICE_MENU: SpecimenMenuItem[] = [
  { label: "View invoice", selected: true },
  { label: "Download PDF" },
  { label: "Send reminder" },
  { label: "Refund payment", tone: "danger" }
];

export const Layering: Story = {
  render: () => ({
    components: { Button, SpecimenMenu },
    setup() {
      return { menuItems: INVOICE_MENU };
    },
    template: `
      <div class="max-w-3xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Layers in context</h2>
          <p class="text-sm text-muted">
            The three slots composed the way a real screen stacks them: a resting
            invoice card, its actions menu raised above it, and a confirmation
            dialog at overlay level.
          </p>
        </header>
        <div class="relative h-80 overflow-hidden rounded-card border border-stroke bg-canvas p-6">
          <div class="w-72 rounded-card bg-surface p-4 shadow-card">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-display">Invoice #INV-2049</span>
              <span class="rounded-badge bg-warning-muted px-2 py-0.5 text-2xs font-medium text-warning-muted-contrast">Due soon</span>
            </div>
            <div class="mt-3 space-y-1.5 text-xs text-body">
              <div class="flex justify-between"><span>Atlas Pro Hosting</span><span class="font-mono">$24.00</span></div>
              <div class="flex justify-between"><span>Wildcard SSL</span><span class="font-mono">$89.00</span></div>
              <div class="flex justify-between border-t border-stroke pt-1.5 font-medium text-display"><span>Total</span><span class="font-mono">$113.00</span></div>
            </div>
          </div>
          <SpecimenMenu class="absolute top-20 left-64 w-44" elevation="raised" :items="menuItems" />
          <div class="absolute right-6 bottom-6 w-72 rounded-overlay border border-stroke bg-surface p-4 shadow-overlay">
            <div class="type-display text-base text-display">Cancel service?</div>
            <p class="mt-1 text-xs text-muted">
              Atlas Pro Hosting stays active until 28 June. No further invoices will
              be raised.
            </p>
            <div class="mt-3 flex justify-end gap-2">
              <Button size="xs" variant="ghost">Keep service</Button>
              <Button size="xs" variant="danger">Cancel service</Button>
            </div>
          </div>
        </div>
      </div>
    `
  })
};
