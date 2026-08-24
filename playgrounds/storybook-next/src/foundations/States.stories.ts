import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "@upmind/ui/components/button/index.ts";
import { Skeleton } from "@upmind/ui/components/skeleton/index.ts";
import { CircleAlert, CreditCard } from "lucide-vue-next";
import { SpecimenInput } from "./foundation-helpers.ts";

/**
 * Every surface in Upmind UI has five lives: resting, loading, empty, disabled
 * and invalid — and each one is a token recipe, not an improvisation. This
 * page shows one card in all five states with the exact vocabulary under
 * each, so any new component (or agent) can copy the recipe verbatim.
 */
const meta: Meta = {
  title: "Foundations/States",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

export const TheFiveStates: Story = {
  parameters: {
    a11y: {
      // State specimen: the disabled card deliberately renders the system's
      // disabled:opacity-50 recipe and the invalid card the text-danger
      // message idiom — axe flags those literal state colors by design.
      // Every other axe rule still runs at error severity.
      config: { rules: [{ id: "color-contrast", enabled: false }] }
    }
  },
  render: () => ({
    components: { Button, Skeleton, SpecimenInput, CircleAlert, CreditCard },
    template: `
      <div class="max-w-6xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">One card, five states</h2>
          <p class="text-sm text-muted">
            The same payment-method card resting, loading, empty, disabled and
            invalid. The mono caption under each card is the complete recipe —
            semantic tokens and state utilities only, nothing invented per
            component.
          </p>
        </header>
        <div class="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">

          <div class="space-y-2">
            <div class="w-full rounded-card border border-stroke bg-surface p-4 shadow-card">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-medium text-display">Payment method</h3>
                <span class="rounded-badge bg-success-muted px-2 py-0.5 text-2xs font-medium text-success-muted-contrast">Default</span>
              </div>
              <p class="mt-1 text-xs text-muted">Visa ending 4242 · expires 04/28</p>
              <SpecimenInput class="mt-3 w-full" placeholder="Name on card" aria-label="Name on card" />
              <div class="mt-3">
                <Button size="sm" block>Save card</Button>
              </div>
            </div>
            <div class="space-y-0.5 px-1">
              <div class="text-2xs font-medium text-muted">Resting</div>
              <div class="font-mono text-2xs leading-relaxed text-muted">rounded-card border border-stroke bg-surface shadow-card · field: shadow-field border-(--border-control)</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="w-full rounded-card border border-stroke bg-surface p-4 shadow-card" aria-busy="true">
              <div class="flex items-center justify-between gap-2">
                <Skeleton class="h-4 w-28" />
                <Skeleton class="h-4 w-14 rounded-badge" />
              </div>
              <Skeleton class="mt-2 h-3 w-44" />
              <Skeleton class="mt-3 h-9 w-full rounded-field" />
              <Skeleton class="mt-3 h-8 w-full rounded-button" />
            </div>
            <div class="space-y-0.5 px-1">
              <div class="text-2xs font-medium text-muted">Loading</div>
              <div class="font-mono text-2xs leading-relaxed text-muted">&lt;Skeleton&gt; — bg-skeleton, shimmer paced by --motion-slower, data-motion-preserve (motion-reduce: slow pulse) · wrapper aria-busy</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex w-full flex-col items-center rounded-card border border-dashed border-stroke p-6 text-center">
              <CreditCard class="size-6 text-faint" aria-hidden="true" />
              <h3 class="mt-3 text-sm font-medium text-display">No payment methods</h3>
              <p class="mt-1 text-xs text-muted">Add a card to enable auto-pay for your services.</p>
              <div class="mt-4">
                <Button size="sm" variant="secondary">Add payment method</Button>
              </div>
            </div>
            <div class="space-y-0.5 px-1">
              <div class="text-2xs font-medium text-muted">Empty</div>
              <div class="font-mono text-2xs leading-relaxed text-muted">border border-dashed border-stroke (no shadow, no fill) · icon text-faint · copy text-muted · one secondary action</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="w-full rounded-card border border-stroke bg-surface p-4 shadow-card">
              <div class="flex items-center justify-between gap-2 opacity-50">
                <h3 class="text-sm font-medium text-display">Payment method</h3>
                <span class="rounded-badge bg-neutral-muted px-2 py-0.5 text-2xs font-medium text-neutral-muted-contrast">Locked</span>
              </div>
              <p class="mt-1 text-xs text-muted opacity-50">Billing is managed by your reseller.</p>
              <SpecimenInput class="mt-3 w-full" placeholder="Name on card" aria-label="Name on card" disabled />
              <div class="mt-3">
                <Button size="sm" block disabled>Save card</Button>
              </div>
            </div>
            <div class="space-y-0.5 px-1">
              <div class="text-2xs font-medium text-muted">Disabled</div>
              <div class="font-mono text-2xs leading-relaxed text-muted">disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed · real disabled attr (or aria-disabled), never pointer-events alone</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="w-full rounded-card border border-stroke bg-surface p-4 shadow-card">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-medium text-display">Payment method</h3>
                <span class="rounded-badge bg-danger-muted px-2 py-0.5 text-2xs font-medium text-danger-muted-contrast">Action needed</span>
              </div>
              <p class="mt-1 text-xs text-muted">Visa ending 4242 · expires 04/28</p>
              <SpecimenInput
                class="mt-3 w-full"
                placeholder="Name on card"
                aria-label="Name on card"
                aria-invalid="true"
                aria-describedby="states-card-error"
              />
              <p
                id="states-card-error"
                role="alert"
                class="mt-1.5 flex items-center gap-1 text-xs text-danger animate-in fade-in zoom-in-50 duration-fast ease-out"
              >
                <CircleAlert class="size-3.5 shrink-0" aria-hidden="true" />
                Name on card is required.
              </p>
              <div class="mt-3">
                <Button size="sm" block>Save card</Button>
              </div>
            </div>
            <div class="space-y-0.5 px-1">
              <div class="text-2xs font-medium text-muted">Invalid</div>
              <div class="font-mono text-2xs leading-relaxed text-muted">aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20 · message role="alert" text-danger, enters with the indicator idiom</div>
            </div>
          </div>

        </div>
        <p class="max-w-2xl text-2xs text-muted">
          Controls have their own invalid grammar: bordered controls
          (checkbox, radio, pin cells, picker triggers) use
          <span class="font-mono">aria-invalid:border-danger aria-invalid:focus-visible:outline-danger/50</span>;
          the borderless switch uses
          <span class="font-mono">aria-invalid:ring-1 aria-invalid:ring-danger</span>.
        </p>
      </div>
    `
  })
};
