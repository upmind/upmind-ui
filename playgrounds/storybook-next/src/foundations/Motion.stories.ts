import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Spinner } from "@upmind/ui/components/spinner/index.ts";
import { Check } from "lucide-vue-next";
import { computed, onUnmounted, ref, type PropType } from "vue";
import { readToken, SpecimenMenu, useThemeTick } from "./foundation-helpers.ts";

/**
 * Motion in Upmind UI is a token vocabulary, not a free-for-all: four durations
 * (`duration-fast/base/slow/slower`) and four easings (`ease-out/in-out/
 * exit/spring`) resolved from theme slots (`--motion-*`). Bare `transition`
 * already speaks the house voice (base duration + house enter curve); every
 * `animate-in`/`animate-out` pairs with an explicit `duration-*` AND
 * `ease-*`. Exit is always one duration step faster than enter, with
 * `ease-exit`. Never raw `duration-150`-style numerics.
 */
const meta: Meta = {
  title: "Foundations/Motion",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { disable: true }
  }
};

export default meta;
type Story = StoryObj;

const DURATIONS = [
  {
    name: "duration-fast",
    token: "motion-fast",
    use: "micro: indicators, tooltips, hovers, exits of base surfaces"
  },
  {
    name: "duration-base",
    token: "motion-base",
    use: "controls, menus, popovers, tabs"
  },
  {
    name: "duration-slow",
    token: "motion-slow",
    use: "dialogs, sheets, page-level reveals"
  },
  {
    name: "duration-slower",
    token: "motion-slower",
    use: "number rolls, skeleton sweep pacing"
  }
];

const EASINGS = [
  {
    name: "ease-out",
    token: "motion-ease-out",
    use: "the house enter curve — everything arriving on screen"
  },
  {
    name: "ease-in-out",
    token: "motion-ease-in-out",
    use: "sliding indicators, position moves (the Tabs indicator)"
  },
  {
    name: "ease-exit",
    token: "motion-ease-exit",
    use: "accelerating exits (`ease-in` is its alias)"
  }
];

/** A replayable transition swatch: click to send the dot across the track. */
const MotionTrack = {
  props: {
    duration: { type: String, required: true },
    ease: { type: String, required: true }
  },
  setup() {
    const on = ref(false);
    return { on };
  },
  template: `
    <button
      type="button"
      :aria-label="'Replay ' + duration + ' ' + ease"
      class="relative block h-10 w-full cursor-pointer rounded-control bg-canvas outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
      @click="on = !on"
    >
      <span
        class="absolute top-2 left-2 block size-6 rounded-full bg-primary transition-transform"
        :class="[duration, ease, on ? 'translate-x-40' : 'translate-x-0']"
      ></span>
    </button>
  `
};

export const DurationsAndEasings: Story = {
  render: () => ({
    components: { MotionTrack },
    setup() {
      const tick = useThemeTick();
      const durations = computed(() => {
        void tick.value;
        return DURATIONS.map(d => ({ ...d, value: readToken(d.token) }));
      });
      const easings = computed(() => {
        void tick.value;
        return EASINGS.map(e => ({ ...e, value: readToken(e.token) }));
      });
      const springOn = ref(false);
      return { durations, easings, springOn };
    },
    template: `
      <div class="max-w-4xl space-y-10">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Durations &amp; easings</h2>
          <p class="text-sm text-muted">
            Four named durations, four named easings — all theme slots
            (<span class="font-mono text-xs">--motion-*</span>), never raw numbers.
            Click any track to replay it. Bare
            <span class="font-mono text-xs">transition</span> /
            <span class="font-mono text-xs">transition-colors</span> already run at
            <span class="font-mono text-xs">duration-base ease-out</span> — annotate
            only to deviate.
          </p>
        </header>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Durations (paired with ease-out)</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-for="d in durations" :key="d.name" class="rounded-card border border-stroke bg-surface p-4">
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-mono text-xs font-medium text-display">{{ d.name }}</span>
                <span class="font-mono text-2xs text-muted">--{{ d.token }}: {{ d.value }}</span>
              </div>
              <div class="mt-3">
                <MotionTrack :duration="d.name" ease="ease-out" />
              </div>
              <p class="mt-2 text-2xs text-muted">{{ d.use }}</p>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-display">Easings (at duration-slower, so the curve reads)</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-for="e in easings" :key="e.name" class="rounded-card border border-stroke bg-surface p-4">
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-mono text-xs font-medium text-display">{{ e.name }}</span>
                <span class="max-w-44 truncate font-mono text-2xs text-muted" :title="e.value">{{ e.value }}</span>
              </div>
              <div class="mt-3">
                <MotionTrack duration="duration-slower" :ease="e.name" />
              </div>
              <p class="mt-2 text-2xs text-muted">{{ e.use }}</p>
            </div>
            <div class="rounded-card border border-stroke bg-surface p-4">
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-mono text-xs font-medium text-display">ease-spring</span>
                <span class="font-mono text-2xs text-muted">--motion-ease-spring</span>
              </div>
              <div class="mt-3 flex h-10 items-center">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="springOn"
                  aria-label="Replay ease-spring"
                  class="h-6 w-10 cursor-pointer rounded-full p-0.5 outline-none transition-colors duration-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
                  :class="springOn ? 'bg-(--bg-control-checked)' : 'bg-(--bg-control-unchecked)'"
                  @click="springOn = !springOn"
                >
                  <span
                    class="block size-5 rounded-full bg-surface shadow-control transition-transform duration-base ease-spring"
                    :class="springOn ? 'translate-x-4' : 'translate-x-0'"
                  ></span>
                </button>
              </div>
              <p class="mt-2 text-2xs text-muted">
                springy settle — <strong>transitions only, never animate-in/out</strong>,
                and only for ≤16px travel (switch thumbs, indicator settles).
              </p>
            </div>
          </div>
        </section>
      </div>
    `
  })
};

interface ChoreoRow {
  surface: string;
  enter: string;
  exit: string;
  panel: "tooltip" | "menu" | "dialog" | "sheet";
  scrim: boolean;
  scrimEnter?: string;
  scrimExit?: string;
  note?: string;
}

const CHOREOGRAPHY: ChoreoRow[] = [
  {
    surface: "Tooltip, hover-card",
    enter: "animate-in fade-in zoom-in-97 duration-fast ease-out",
    exit: "animate-out fade-out duration-fast ease-exit",
    panel: "tooltip",
    scrim: false
  },
  {
    surface: "Menu, popover, select, combobox, context menu",
    enter:
      "animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-base ease-out",
    exit: "animate-out fade-out zoom-out-98 duration-fast ease-exit",
    panel: "menu",
    scrim: false,
    note: "plus origin-(--reka-popper-transform-origin) so it grows from its trigger"
  },
  {
    surface: "Dialog, alert dialog, command palette",
    enter:
      "animate-in fade-in zoom-in-96 slide-in-from-bottom-2 duration-slow ease-out",
    exit: "animate-out fade-out zoom-out-98 duration-base ease-exit",
    panel: "dialog",
    scrim: true,
    scrimEnter: "animate-in fade-in duration-slow ease-out",
    scrimExit: "animate-out fade-out duration-base ease-exit"
  },
  {
    surface: "Sheet",
    enter: "animate-in slide-in-from-right duration-slow ease-out",
    exit: "animate-out slide-out-to-right duration-base ease-exit",
    panel: "sheet",
    scrim: true,
    scrimEnter: "animate-in fade-in duration-slow ease-out",
    scrimExit: "animate-out fade-out duration-base ease-exit"
  }
];

/**
 * Replays an overlay's full life: mount with the enter classes, swap to the
 * exit classes, then unmount on animationend — exactly how reka's Presence
 * removes overlay parts in the real components.
 */
const ChoreoDemo = {
  components: { SpecimenMenu },
  props: {
    row: { type: Object as PropType<ChoreoRow>, required: true }
  },
  setup() {
    const phase = ref<"idle" | "enter" | "exit">("idle");
    const playKey = ref(0);
    let timer: number | undefined;
    const play = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      playKey.value++;
      phase.value = "enter";
      timer = window.setTimeout(() => {
        phase.value = "exit";
      }, 1000);
    };
    const onPanelAnimationEnd = () => {
      if (phase.value === "exit") phase.value = "idle";
    };
    onUnmounted(() => {
      if (timer !== undefined) window.clearTimeout(timer);
    });
    return { phase, playKey, play, onPanelAnimationEnd };
  },
  template: `
    <div class="relative h-40 overflow-hidden rounded-card border border-stroke bg-canvas">
      <button
        type="button"
        class="absolute top-2 left-2 z-10 inline-flex h-7 cursor-pointer items-center rounded-button bg-neutral-muted px-2.5 text-xs font-medium text-neutral-muted-contrast transition-colors hover:bg-neutral-muted-delta outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
        @click="play"
      >Replay</button>
      <template v-if="phase !== 'idle'">
        <div
          v-if="row.scrim"
          :key="'scrim-' + playKey"
          class="absolute inset-0 bg-scrim"
          :class="phase === 'enter' ? row.scrimEnter : row.scrimExit"
        ></div>
        <div
          v-if="row.panel === 'tooltip'"
          :key="'panel-' + playKey"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-message bg-overlay px-2.5 py-1 text-2xs text-overlay-contrast shadow-raised"
          :class="phase === 'enter' ? row.enter : row.exit"
          @animationend="onPanelAnimationEnd"
        >Renews 28 June · $24.00</div>
        <SpecimenMenu
          v-else-if="row.panel === 'menu'"
          :key="'panel-' + playKey"
          class="absolute top-12 left-1/2 w-40 -translate-x-1/2"
          elevation="overlay"
          :class="phase === 'enter' ? row.enter : row.exit"
          @animationend="onPanelAnimationEnd"
        />
        <div
          v-else-if="row.panel === 'dialog'"
          :key="'panel-' + playKey"
          class="absolute top-1/2 left-1/2 w-56 -translate-x-1/2 -translate-y-1/2 rounded-overlay border border-stroke bg-surface p-3 shadow-overlay"
          :class="phase === 'enter' ? row.enter : row.exit"
          @animationend="onPanelAnimationEnd"
        >
          <div class="type-display text-sm text-display">Cancel service?</div>
          <p class="mt-1 text-2xs text-muted">Atlas Pro Hosting stays active until 28 June.</p>
        </div>
        <div
          v-else
          :key="'panel-' + playKey"
          class="absolute inset-y-2 right-2 w-32 rounded-card border border-stroke bg-surface p-3 shadow-overlay"
          :class="phase === 'enter' ? row.enter : row.exit"
          @animationend="onPanelAnimationEnd"
        >
          <div class="text-xs font-medium text-display">Service details</div>
          <p class="mt-1 text-2xs text-muted">Atlas Pro Hosting</p>
        </div>
      </template>
    </div>
  `
};

export const Choreography: Story = {
  render: () => ({
    components: { ChoreoDemo },
    setup() {
      return { rows: CHOREOGRAPHY };
    },
    template: `
      <div class="max-w-5xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Overlay choreography</h2>
          <p class="text-sm text-muted">
            One table covers every overlay family. Two invariants:
            <strong>exit is one duration step faster than enter</strong> (with
            <span class="font-mono text-xs">ease-exit</span>), and the scrim fades
            with the same timings as its panel
            (<span class="font-mono text-xs">bg-scrim</span>, no backdrop blur).
            Each demo mounts with the enter classes and unmounts on
            <span class="font-mono text-xs">animationend</span>, like reka's Presence.
          </p>
        </header>
        <div class="space-y-4">
          <div v-for="row in rows" :key="row.surface" class="rounded-card border border-stroke bg-surface p-4">
            <div class="grid gap-4 lg:grid-cols-2">
              <div class="min-w-0 space-y-2">
                <h3 class="text-sm font-medium text-display">{{ row.surface }}</h3>
                <dl class="space-y-1.5">
                  <div class="flex gap-2">
                    <dt class="w-10 shrink-0 text-2xs font-medium text-muted">enter</dt>
                    <dd class="min-w-0 font-mono text-2xs wrap-break-word text-body">{{ row.enter }}</dd>
                  </div>
                  <div class="flex gap-2">
                    <dt class="w-10 shrink-0 text-2xs font-medium text-muted">exit</dt>
                    <dd class="min-w-0 font-mono text-2xs wrap-break-word text-body">{{ row.exit }}</dd>
                  </div>
                  <div v-if="row.scrim" class="flex gap-2">
                    <dt class="w-10 shrink-0 text-2xs font-medium text-muted">scrim</dt>
                    <dd class="min-w-0 font-mono text-2xs wrap-break-word text-body">bg-scrim · fades with the panel's timings</dd>
                  </div>
                </dl>
                <p v-if="row.note" class="text-2xs text-muted">{{ row.note }}</p>
              </div>
              <ChoreoDemo :row="row" />
            </div>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <h3 class="text-sm font-medium text-display">Toast</h3>
            <p class="mt-1 max-w-2xl text-2xs text-muted">
              vue-sonner owns toast motion. Never pass <span class="font-mono">duration</span>
              — that prop is toast <em>lifetime</em>, not animation speed. Theme toasts via
              <span class="font-mono">toastOptions</span> classes only.
            </p>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-4">
            <h3 class="text-sm font-medium text-display">Accordion / collapsible</h3>
            <p class="mt-1 max-w-2xl text-2xs text-muted">
              Measured-height keyframes on motion tokens:
              <span class="font-mono">animate-accordion-down</span> /
              <span class="font-mono">animate-collapsible-down</span> open at
              <span class="font-mono">var(--motion-base) var(--motion-ease-out)</span>,
              close at <span class="font-mono">var(--motion-fast) var(--motion-ease-exit)</span>.
            </p>
          </div>
        </div>
      </div>
    `
  })
};

/** Indicator parts mount with the idiom classes — toggle to replay. */
const IndicatorDemo = {
  components: { Check },
  props: {
    kind: {
      type: String as PropType<"checkbox" | "radio" | "menu">,
      required: true
    }
  },
  setup() {
    const on = ref(true);
    return { on };
  },
  template: `
    <button
      v-if="kind === 'checkbox'"
      type="button"
      role="checkbox"
      :aria-checked="on"
      aria-label="Auto-renew domain"
      class="grid size-6 min-h-[24px] min-w-[24px] cursor-pointer place-items-center rounded-control border outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40 active:scale-96 active:duration-0"
      :class="on ? 'border-transparent bg-(--bg-control-checked) text-(--bg-control-checked-contrast)' : 'border-(--border-control) bg-(--bg-control-surface)'"
      @click="on = !on"
    >
      <Check v-if="on" class="size-4 animate-in fade-in zoom-in-50 duration-fast ease-out" aria-hidden="true" />
    </button>
    <button
      v-else-if="kind === 'radio'"
      type="button"
      role="radio"
      :aria-checked="on"
      aria-label="Monthly billing"
      class="grid size-6 min-h-[24px] min-w-[24px] cursor-pointer place-items-center rounded-full border outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40 active:scale-96 active:duration-0"
      :class="on ? 'border-transparent bg-(--bg-control-checked)' : 'border-(--border-control) bg-(--bg-control-surface)'"
      @click="on = !on"
    >
      <span v-if="on" class="block size-2 rounded-full bg-(--bg-control-checked-contrast) animate-in fade-in zoom-in-50 duration-fast ease-out"></span>
    </button>
    <button
      v-else
      type="button"
      role="menuitemcheckbox"
      :aria-checked="on"
      class="flex w-44 cursor-pointer items-center gap-2 rounded-control bg-(--bg-control-selected) px-2 py-1.5 text-left text-2xs text-(--text-control-selected) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
      @click="on = !on"
    >
      <span class="grid size-3.5 place-items-center">
        <Check v-if="on" class="size-3.5 animate-in fade-in zoom-in-50 duration-fast ease-out" aria-hidden="true" />
      </span>
      Auto-renew enabled
    </button>
  `
};

export const IndicatorIdiom: Story = {
  render: () => ({
    components: { IndicatorDemo },
    template: `
      <div class="max-w-3xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">The indicator idiom</h2>
          <p class="text-sm text-muted">
            The system's signature check-in. Every selection mark — checkbox check,
            radio dot, select/menu item check, stepper complete — enters with
            <span class="font-mono text-xs">animate-in fade-in zoom-in-50 duration-fast ease-out</span>
            on the indicator part: bound to
            <span class="font-mono text-xs">data-[state=checked]:</span> where the part
            stays mounted, plain (mount-time) where reka mounts/unmounts it. Toggle
            the specimens to replay.
          </p>
        </header>
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="flex flex-col items-center gap-3 rounded-card border border-stroke bg-surface p-5">
            <IndicatorDemo kind="checkbox" />
            <div class="text-center font-mono text-2xs text-muted">checkbox check</div>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-card border border-stroke bg-surface p-5">
            <IndicatorDemo kind="radio" />
            <div class="text-center font-mono text-2xs text-muted">radio dot</div>
          </div>
          <div class="flex flex-col items-center gap-3 rounded-card border border-stroke bg-surface p-5">
            <div role="menu" aria-label="Auto-renew options">
              <IndicatorDemo kind="menu" />
            </div>
            <div class="text-center font-mono text-2xs text-muted">menu item check</div>
          </div>
        </div>
        <p class="max-w-2xl text-2xs text-muted">
          A check animating inside an opening menu staggers naturally against the
          panel's entrance — that nesting is intentional, keep it. Tabs is the one
          exception: it uses a sliding <span class="font-mono">TabsIndicator</span>
          with <span class="font-mono">transition-[width,height,transform] duration-base ease-in-out</span>
          instead of a mount animation.
        </p>
      </div>
    `
  })
};

export const ReducedMotion: Story = {
  render: () => ({
    components: { Spinner },
    template: `
      <div class="max-w-3xl space-y-6">
        <header class="max-w-2xl space-y-2">
          <h2 class="type-display text-2xl text-display">Reduced motion</h2>
          <p class="text-sm text-muted">
            One global mechanism, no per-component opt-outs: under
            <span class="font-mono text-xs">prefers-reduced-motion: reduce</span> the
            base layer collapses every animation and transition to 0.01ms — except
            elements carrying <span class="font-mono text-xs">data-motion-preserve</span>.
          </p>
        </header>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-card border border-stroke bg-surface p-5">
            <div class="flex items-center gap-3">
              <Spinner label="Loading services" />
              <span class="text-xs text-muted">still spins under reduced motion</span>
            </div>
            <p class="mt-3 text-2xs text-muted">
              <span class="font-mono">data-motion-preserve</span> sits ON the animated
              element itself — the Spinner's svg, Button's loading spinner, Progress's
              indeterminate bar, Skeleton's shimmer (which additionally swaps to a slow
              pulse via <span class="font-mono">motion-reduce:</span>). It marks motion
              that communicates "still working".
            </p>
          </div>
          <div class="rounded-card border border-stroke bg-surface p-5">
            <div class="text-2xs font-medium text-display">Delight motion must NOT use it</div>
            <p class="mt-2 text-2xs text-muted">
              Entrances, number rolls and indicator check-ins simply snap into place
              when the user asks for less motion. The 0.01ms collapse still fires
              <span class="font-mono">animationend</span>, so reka's Presence unmounts
              overlays correctly.
            </p>
          </div>
        </div>
        <pre class="overflow-x-auto rounded-message border border-stroke bg-surface p-4 font-mono text-xs leading-relaxed text-body">@media (prefers-reduced-motion: reduce) {
  *:not([data-motion-preserve]),
  *:not([data-motion-preserve])::before,
  *:not([data-motion-preserve])::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}</pre>
      </div>
    `
  })
};
