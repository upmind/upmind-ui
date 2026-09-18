import { afterEach } from "vitest";
import { config } from "@vue/test-utils";
import * as vue from "vue";
import { createI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";
import labs from "@upmind-automation/i18n/modules/labs-en.json";
import { forEach, toPairs } from "lodash-es";

// lottie-web (icon-animated's dep, reached through `packages/ui`'s barrel)
// probes canvas support at import time; jsdom has no native 2D context, so a
// bare barrel import throws before any test runs. Stub only what that probe
// touches. It sits in the lane's setup rather than per spec because
// `setupFiles` are evaluated before any test file loads, so one stub serves
// every mount — this file imports no barrel of its own.
HTMLCanvasElement.prototype.getContext = (() => ({
  fillStyle: "",
  fillRect: () => {}
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// jsdom implements no layout, so it ships no `scrollIntoView` at all — a
// surface that keeps its active row visible calls a method that does not exist
// and the render throws. A no-op is the whole of what a lane computing no
// layout can honestly assert about scrolling; the visible-row claim belongs to
// the browser lane.
Element.prototype.scrollIntoView = () => {};

/**
 * Nuxt writes the imports a page's `<script setup>` never declares — `ref`,
 * `computed`, and the rest of Vue's surface — during its own build, which
 * vitest never boots (`vitest.config.ts:9-11`). So a page mounts here with
 * those names unbound and throws `ref is not defined` before a single
 * assertion runs.
 *
 * The bind is Vue's REAL surface, not a set of doubles: a faked `computed`
 * would let a page pass while computing nothing. Existing globals win — jsdom
 * already owns `Text` and `Comment`, and Vue exports both names.
 *
 * It sits in the lane's setup for the same reason the shims above do: pages,
 * layouts and the registrar's mounts all share the gap, and `setupFiles` are
 * evaluated before any spec loads.
 */
forEach(toPairs(vue), ([name, value]) => {
  if (name in globalThis) return;
  (globalThis as Record<string, unknown>)[name] = value;
});

/**
 * `definePageMeta` is a BUILD-time macro: Nuxt hoists the call out of the
 * component and into the route record, leaving nothing behind at runtime. A
 * no-op is the honest double — the route metadata it declares is the router's
 * claim to prove, never this lane's.
 */
(globalThis as Record<string, unknown>).definePageMeta ??= () => undefined;

/**
 * `useRoute` and `useRouter` are Nuxt auto-imports too, and Nuxt's own are
 * re-exports of vue-router's — so the bind is the REAL surface for the same
 * reason the Vue one above is: a faked route would let a page pass while
 * reading nothing. Each still throws without an installed router, which is the
 * honest answer for a mount that declares none.
 *
 * Without them a page that reads the current route dies with
 * `useRoute is not defined` before its first assertion, and every claim in the
 * spec reports the missing global rather than the behaviour under test.
 */
forEach(toPairs({ useRoute, useRouter }), ([name, value]) => {
  (globalThis as Record<string, unknown>)[name] ??= value;
});

/**
 * The factory surfaces call `useI18n()` in `setup`, which throws without an
 * installed plugin — so every component mount in this project gets one, built
 * from the REAL `packages/i18n/src` catalogue (`src`, never `public/locales`,
 * which is the Localazy download target). A stub catalogue would let a surface
 * render a raw key and still pass. `labs` is the playground's own module
 * namespace, installed beside the core six so a surface that renders a
 * `DisplayRow` reads real copy rather than a raw `labs.*` key.
 */
config.global.plugins = [
  createI18n({
    legacy: false,
    locale: "en",
    messages: { en: { action, confirm, error, form, labs, text, validation } }
  })
];

/**
 * `vue-sonner` closes a toast on its OWN timer, and the callback that timer
 * runs (`removeToast` → `ToastState.dismiss(id)`) calls `requestAnimationFrame`
 * SYNCHRONOUSLY. A spec that raises a toast and ends before that timer elapses
 * leaves it pending: it then fires into a torn-down environment, where jsdom's
 * `requestAnimationFrame` no longer exists, and vitest reports an unhandled
 * `ReferenceError`. Every test passes and the run still exits NON-ZERO.
 *
 * Stubbing the global cannot fix it. jsdom defines `requestAnimationFrame` for
 * the whole of a test, so a `??=` guard never installs; and vitest's own jsdom
 * teardown does `keys.forEach(key => delete global[key])`, so even an
 * unconditional assignment is deleted before the stale timer lands either way.
 *
 * So cut the timer instead of the symptom. UNMOUNTING is what cuts it — a
 * toast's timer belongs to its component, and the component's own teardown
 * clears it. `clearToasts()` is not the tool here: its `document.body` wipe
 * pulls the nodes out from under components still mounted, and Vue's later
 * unmount then walks a detached tree (`Cannot read properties of null (reading
 * 'nextSibling')`). Leave that helper to the four specs that call it
 * deliberately at their own end.
 *
 * Auto-unmounting every wrapper is not the tool either: specs that mount once
 * per `describe` and read the same surface across their tests lose it.
 *
 * What is left is `toast.dismiss()`, which clears the queue `vue-sonner` keeps
 * in MODULE state — it outlives any one mount, so a toast raised in one test is
 * still queued in the next. Dismissing collapses the pending window from the
 * toast's full lifetime to the exit animation, which is the shortest window a
 * lane-wide hook can honestly reach without touching how specs mount. The
 * import is dynamic because this file's canvas stub above must run BEFORE the
 * `@upmind/ui` barrel is evaluated, and a static import would hoist over it.
 */
afterEach(async () => {
  const { toast } = await import("@upmind/ui");
  toast.dismiss();
});
