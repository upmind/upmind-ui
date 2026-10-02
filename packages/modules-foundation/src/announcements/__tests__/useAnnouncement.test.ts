// -----------------------------------------------------------------------------
/**
 * @fileoverview The app's one announcement
 *
 * ## Job To Be Done
 * A page shows or dismisses the announcement, and the shell's bar draws that same one — no provider in between.
 *
 * ## What Breaks If These Fail
 * A payment banner never reaches the bar, or a dismissed banner stays on screen.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { useAnnouncement } from "../../index";
import type { AnnouncementOptions } from "../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("../../__tests__/headless.stub");
  return createHeadlessStub();
});

// -----------------------------------------------------------------------------

const PAYMENT_FAILED: AnnouncementOptions = {
  text: "Your payment could not be taken",
  type: "danger",
  icon: "alert"
};

const PAYMENT_TAKEN: AnnouncementOptions = {
  text: "Payment taken",
  type: "success"
};

const Bar = defineComponent({
  setup() {
    const { announcement, isVisible } = useAnnouncement();

    return () => {
      if (!isVisible.value) return null;
      return h("output", announcement.value?.text);
    };
  }
});

function mountShellWithPage() {
  const pages: ReturnType<typeof useAnnouncement>[] = [];
  const pageMounted = ref(true);

  const Page = defineComponent({
    setup() {
      pages.push(useAnnouncement());
      return () => h("main");
    }
  });

  const Shell = defineComponent({
    setup: () => () => {
      if (!pageMounted.value) return h("div", [h(Bar)]);
      return h("div", [h(Bar), h(Page)]);
    }
  });

  const wrapper = mount(Shell);
  const [page] = pages;

  if (!page) throw new Error("the page never set up");

  return { wrapper, page, pageMounted };
}

function barText(wrapper: ReturnType<typeof mount>) {
  const bar = wrapper.find("output");

  if (!bar.exists()) return null;
  return bar.text();
}

afterEach(() => {
  useAnnouncement().dismiss();
});

// -----------------------------------------------------------------------------

describe("useAnnouncement — one announcement the whole app shares", () => {
  it("draws a page's announcement in the bar beside it, with no provider in the tree", async () => {
    const { wrapper, page } = mountShellWithPage();

    page.show(PAYMENT_FAILED);
    await nextTick();

    expect(barText(wrapper)).toBe(PAYMENT_FAILED.text);
  });

  it("takes the bar down when any caller dismisses", async () => {
    const { wrapper, page } = mountShellWithPage();
    page.show(PAYMENT_FAILED);
    await nextTick();

    useAnnouncement().dismiss();
    await nextTick();

    expect(barText(wrapper)).toBeNull();
    expect(page.isVisible.value).toBe(false);
    expect(page.announcement.value).toBeNull();
  });

  it("gives every caller the same visibility and the same announcement", () => {
    const shower = useAnnouncement();
    const reader = useAnnouncement();

    expect(reader.isVisible.value).toBe(false);

    shower.show(PAYMENT_TAKEN);

    expect(reader.isVisible.value).toBe(true);
    expect(reader.announcement.value?.text).toBe(PAYMENT_TAKEN.text);
    expect(reader.announcement.value?.type).toBe(PAYMENT_TAKEN.type);
  });

  it("carries the action the page gave it to whoever draws it", () => {
    const onAction = vi.fn();

    useAnnouncement().show({ text: PAYMENT_FAILED.text, onAction });
    useAnnouncement().announcement.value?.onAction?.();

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("draws the latest announcement in place of the one before", async () => {
    const { wrapper, page } = mountShellWithPage();

    page.show(PAYMENT_FAILED);
    page.show(PAYMENT_TAKEN);
    await nextTick();

    expect(barText(wrapper)).toBe(PAYMENT_TAKEN.text);
  });

  it("keeps the announcement on the bar after the page that showed it goes away", async () => {
    const { wrapper, page, pageMounted } = mountShellWithPage();
    page.show(PAYMENT_TAKEN);

    pageMounted.value = false;
    await nextTick();

    expect(wrapper.find("main").exists()).toBe(false);
    expect(barText(wrapper)).toBe(PAYMENT_TAKEN.text);
  });
});
