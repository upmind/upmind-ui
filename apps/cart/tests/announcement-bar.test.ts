// -----------------------------------------------------------------------------
/**
 * @fileoverview The cart shell's announcement bar
 *
 * ## Job To Be Done
 * The shell's bar draws `foundation`'s one announcement, and its dismiss clears that same one.
 *
 * ## What Breaks If These Fail
 * A page's payment banner never reaches the cart, or a dismissed banner comes back from another page.
 */

import { AnnouncementBar } from "@upmind/ui";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { useAnnouncement } from "@upmind-automation/foundation";
import Upmind from "../src/shell/Upmind.vue";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual =
    await importOriginal<typeof import("@upmind-automation/headless")>();
  const { computed, ref } = await import("vue");
  const status = ref(actual.UpmindStatus.initialised);

  return {
    ...actual,
    default: { status, isReady: () => Promise.resolve(true) },
    useRoutingEngine: () => ({
      meta: computed(() => ({ isInitialRoute: false }))
    }),
    useConfig: () => ({ ui: { theme: ref("default") } })
  };
});

vi.mock("../src/shell/modules/theming", () => ({
  useTheme: () => ({ isReady: () => Promise.resolve(true) }),
  useThemes: () => ({ set: () => Promise.resolve() })
}));

const PAYMENT_TAKEN = { text: "Payment taken", type: "success" } as const;

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false,
  messages: { en: {} }
});

let wrapper: VueWrapper | undefined;

async function mountShell() {
  wrapper = shallowMount(Upmind, {
    global: {
      plugins: [i18n],
      stubs: { AnnouncementBar: false },
      renderStubDefaultSlot: true
    }
  });
  await flushPromises();
  return wrapper;
}

function barIn(shell: VueWrapper) {
  return shell.findComponent(AnnouncementBar);
}

afterEach(() => {
  useAnnouncement().dismiss();
  wrapper?.unmount();
  wrapper = undefined;
});

// -----------------------------------------------------------------------------

describe("the cart shell's announcement bar", () => {
  it("draws the announcement a page shows through foundation", async () => {
    const shell = await mountShell();
    expect(barIn(shell).exists()).toBe(false);

    useAnnouncement().show(PAYMENT_TAKEN);
    await nextTick();

    expect(barIn(shell).exists(), "the bar never drew the page's show").toBe(
      true
    );
    expect(barIn(shell).text()).toContain(PAYMENT_TAKEN.text);
    expect(barIn(shell).props("variant")).toBe(PAYMENT_TAKEN.type);
  });

  it("draws an announcement a page showed before the shell was ready", async () => {
    useAnnouncement().show(PAYMENT_TAKEN);

    const shell = await mountShell();

    expect(barIn(shell).text()).toContain(PAYMENT_TAKEN.text);
  });

  it("takes the bar down when a page dismisses through foundation", async () => {
    const shell = await mountShell();
    useAnnouncement().show(PAYMENT_TAKEN);
    await nextTick();
    expect(barIn(shell).exists()).toBe(true);

    useAnnouncement().dismiss();
    await nextTick();

    expect(barIn(shell).exists()).toBe(false);
  });

  it("clears foundation's announcement when the bar is dismissed", async () => {
    const shell = await mountShell();
    const page = useAnnouncement();
    page.show(PAYMENT_TAKEN);
    await nextTick();

    barIn(shell).vm.$emit("dismiss");
    await nextTick();

    expect(page.isVisible.value, "the page still holds the banner").toBe(false);
    expect(barIn(shell).exists()).toBe(false);
  });
});
