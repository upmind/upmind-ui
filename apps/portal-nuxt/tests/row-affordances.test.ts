// -----------------------------------------------------------------------------
/**
 * @module tests/row-affordances
 * @description Plan R13 (plus the banner notice's action and the metric
 * tile's link): the four affordances legacy's rows carry — a status badge, a
 * masked secret with reveal and copy, a switch, a copyable spec value — added
 * ONCE to the generic renderers rather than per page. Controls are found by
 * the accessible name the CALLER supplied, never by a class, so the markup
 * stays the module's own.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import type { VueWrapper } from "@vue/test-utils";
import Banner from "~/portal/modules/banner/Banner.vue";
import List from "~/portal/modules/list/List.vue";
import Metric from "~/portal/modules/metric/Metric.vue";
import Spec from "~/portal/modules/spec/Spec.vue";

const SECRET_VALUE = "hunter2-swordfish-9931";

const REVEAL_LABEL = "Reveal value";

const COPY_LABEL = "Copy value";

/** Accessible name, however the module spells it — `aria-label` or visible text. */
function control(wrapper: VueWrapper, name: string) {
  return wrapper
    .findAll("button")
    .find(
      button =>
        button.attributes("aria-label") === name ||
        button.text().trim() === name
    );
}

function mountList(item: Record<string, unknown>) {
  return mount(List, {
    props: {
      variant: "compact",
      items: [item],
      emptyTitle: "Nothing here",
      revealLabel: REVEAL_LABEL,
      copyLabel: COPY_LABEL
    }
  });
}

function mountSpec(item: Record<string, unknown>) {
  return mount(Spec, {
    props: {
      items: [item],
      emptyTitle: "Nothing here",
      revealLabel: REVEAL_LABEL,
      copyLabel: COPY_LABEL
    }
  });
}

describe("list rows — status (R13)", () => {
  it("renders the status label and carries its tone into the markup", () => {
    const active = mountList({
      id: "p1",
      title: "gilded-estates.com",
      status: { label: "Active", tone: "success" }
    });
    const suspended = mountList({
      id: "p1",
      title: "gilded-estates.com",
      status: { label: "Suspended", tone: "destructive" }
    });

    expect(active.text()).toContain("Active");
    expect(suspended.text()).toContain("Suspended");
    // Two tones over identical rows: a renderer that drops `tone` emits the
    // same markup for both.
    expect(active.html()).not.toBe(suspended.html());
  });

  it("a status wins over the loose trailing text it supersedes", () => {
    const wrapper = mountList({
      id: "p1",
      title: "gilded-estates.com",
      trailingText: "Pro Plan",
      status: { label: "Active", tone: "success" }
    });

    expect(wrapper.text()).toContain("Active");
    expect(wrapper.text()).not.toContain("Pro Plan");
  });
});

describe("list rows — secret (R13)", () => {
  function mountSecret() {
    return mountList({
      id: "v1",
      title: "SFTP password",
      description: SECRET_VALUE,
      secret: true
    });
  }

  it("masks the value until it is revealed", async () => {
    const wrapper = mountSecret();
    expect(wrapper.text()).not.toContain(SECRET_VALUE);

    const reveal = control(wrapper, REVEAL_LABEL);
    expect(reveal).toBeDefined();
    await reveal?.trigger("click");

    expect(wrapper.text()).toContain(SECRET_VALUE);
  });

  it("offers a copy control that emits the copy verb carrying the value", async () => {
    const wrapper = mountSecret();

    const copy = control(wrapper, COPY_LABEL);
    expect(copy).toBeDefined();
    await copy?.trigger("click");

    expect(wrapper.emitted("select")).toContainEqual([`copy:${SECRET_VALUE}`]);
  });

  it("leaves a plain row unmasked and offers it neither control", () => {
    const wrapper = mountList({
      id: "v1",
      title: "SFTP password",
      description: SECRET_VALUE
    });

    expect(wrapper.text()).toContain(SECRET_VALUE);
    expect(control(wrapper, REVEAL_LABEL)).toBeUndefined();
    expect(control(wrapper, COPY_LABEL)).toBeUndefined();
  });
});

describe("list rows — toggle (R13)", () => {
  function mountToggle(checked: boolean) {
    return mountList({
      id: "rel-1",
      title: "Studio North",
      toggle: {
        value: "toggle-relation:rel-1",
        checked,
        label: "Allow impersonation"
      }
    });
  }

  it("renders a switch showing the state it was GIVEN, both ways", () => {
    expect(
      mountToggle(true).find('[role="switch"]').attributes("aria-checked")
    ).toBe("true");
    expect(
      mountToggle(false).find('[role="switch"]').attributes("aria-checked")
    ).toBe("false");
  });

  it("emits the toggle's own value on change", async () => {
    const wrapper = mountToggle(false);

    await wrapper.find('[role="switch"]').trigger("click");

    expect(wrapper.emitted("select")).toContainEqual(["toggle-relation:rel-1"]);
  });

  it("renders no switch on a row that carries no toggle", () => {
    expect(
      mountList({ id: "rel-1", title: "Studio North" })
        .find('[role="switch"]')
        .exists()
    ).toBe(false);
  });
});

describe("spec rows — copyable and secret (R13)", () => {
  it("a copyable row emits the copy verb carrying its value", async () => {
    const wrapper = mountSpec({
      id: "ref",
      label: "Reference",
      value: "INV-1042-QX",
      copyable: true
    });

    const copy = control(wrapper, COPY_LABEL);
    expect(copy).toBeDefined();
    await copy?.trigger("click");

    expect(wrapper.emitted("select")).toContainEqual(["copy:INV-1042-QX"]);
  });

  it("a secret row masks its value until revealed", async () => {
    const wrapper = mountSpec({
      id: "pin",
      label: "Support PIN",
      value: SECRET_VALUE,
      secret: true
    });
    expect(wrapper.text()).not.toContain(SECRET_VALUE);

    const reveal = control(wrapper, REVEAL_LABEL);
    expect(reveal).toBeDefined();
    await reveal?.trigger("click");

    expect(wrapper.text()).toContain(SECRET_VALUE);
  });

  it("a plain row renders its value with no controls at all", () => {
    const wrapper = mountSpec({
      id: "plan",
      label: "Your plan",
      value: "Starter"
    });

    expect(wrapper.text()).toContain("Starter");
    expect(control(wrapper, COPY_LABEL)).toBeUndefined();
    expect(control(wrapper, REVEAL_LABEL)).toBeUndefined();
  });
});

describe("banner notice — the action beside the message", () => {
  function mountNotice(action?: { value: string; label: string }) {
    return mount(Banner, {
      props: {
        variant: "notice",
        message: "Your server is waiting on setup.",
        label: "Announcements",
        dismissLabel: "Dismiss",
        action
      }
    });
  }

  it("renders the action and emits its value", async () => {
    const wrapper = mountNotice({
      value: "complete-setup:prod-1",
      label: "Complete setup"
    });

    const button = control(wrapper, "Complete setup");
    expect(button).toBeDefined();
    await button?.trigger("click");

    expect(wrapper.emitted("select")).toContainEqual(["complete-setup:prod-1"]);
  });

  it("renders no control at all without one", () => {
    const wrapper = mountNotice();

    expect(wrapper.text()).toContain("Your server is waiting on setup.");
    expect(wrapper.findAll("button")).toHaveLength(0);
  });
});

/**
 * The design system's `Link` resolves `RouterLink` for an in-app `to`, and no
 * router runs under this plain Vite config — so the destination the module
 * hands the router is read back off a stub that renders it as an `href`.
 */
const RouterLinkStub = defineComponent({
  name: "RouterLink",
  props: { to: { type: [String, Object], default: undefined } },
  setup(props, { slots }) {
    return () =>
      h(
        "a",
        { href: typeof props.to === "string" ? props.to : undefined },
        slots.default?.()
      );
  }
});

describe("metric tile — the list a figure counts", () => {
  function mountMetric(to?: string) {
    return mount(Metric, {
      props: {
        variant: "tile",
        items: [{ label: "Open tickets", value: "3", to }],
        emptyTitle: "No metrics"
      },
      global: { components: { RouterLink: RouterLinkStub } }
    });
  }

  it("wraps the tile in a link to the destination it was given", () => {
    const wrapper = mountMetric("/support/tickets");

    expect(wrapper.find("a").exists()).toBe(true);
    expect(wrapper.find("a").attributes("href")).toBe("/support/tickets");
    expect(wrapper.text()).toContain("Open tickets");
  });

  it("renders a plain tile with no link when the figure counts nothing navigable", () => {
    const wrapper = mountMetric();

    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.text()).toContain("Open tickets");
  });
});
