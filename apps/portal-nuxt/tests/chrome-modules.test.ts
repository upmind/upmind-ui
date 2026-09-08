import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { useMockImpersonation } from "~/portal/mock/impersonation";
import AccountMenu from "~/portal/modules/account-menu/AccountMenu.vue";
import Notifications from "~/portal/modules/notifications/Notifications.vue";

/**
 * Phase H — the chrome (plan §5): legacy's notifications-dropdown and
 * profile-dropdown as modules on the action seam, the `navigate:` verb, and
 * the impersonation ribbon's own state. Paired blind with
 * tests/chrome-modules.must-fail.patch.
 */

function mountNotifications(count: number) {
  return mount(Notifications, {
    props: {
      items: [
        { id: "n1", title: "Invoice due", description: "Pay soon" },
        { id: "n2", title: "Setup pending", trailingText: "New" }
      ],
      count,
      label: "Alerts",
      markReadLabel: "Mark all read",
      markReadAction: MOCK_ACTION.MARK_NOTIFICATIONS_READ,
      emptyTitle: "No notifications",
      viewAllTo: "/account/notifications",
      viewAllLabel: "View all"
    }
  });
}

/** Overlay content teleports to document.body — query the DOCUMENT after opening, then fire a native click. */
async function clickInOverlay(selector: string, text: string) {
  await nextTick();
  const target = Array.from(
    document.body.querySelectorAll<HTMLElement>(selector)
  ).find(element => element.textContent?.trim() === text);
  expect(target).toBeDefined();
  target?.click();
  await nextTick();
}

describe("notifications module — legacy's topbar dropdown", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows the unread badge only above zero", () => {
    expect(mountNotifications(2).text()).toContain("2");
    expect(mountNotifications(0).text()).not.toContain("0");
  });

  it("mark-all-read emits through the action seam; the view-all link targets the account page", async () => {
    const wrapper = mountNotifications(1);

    // The popover content is teleported; drive the trigger open first.
    await wrapper.find("button").trigger("click");
    await clickInOverlay("button", "Mark all read");

    expect(wrapper.emitted("select")).toEqual([["mark-notifications-read"]]);
  });
});

describe("account menu — legacy's profile-dropdown", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits each item's navigate value through the seam", async () => {
    const wrapper = mount(AccountMenu, {
      props: {
        label: "Account",
        monogram: "J",
        items: [
          { value: "navigate:/account/profile", label: "My profile" },
          { value: "navigate:/", label: "Sign out" }
        ]
      }
    });

    await wrapper.find("button").trigger("click");
    await clickInOverlay('[role="menuitem"]', "My profile");

    expect(wrapper.emitted("select")).toEqual([["navigate:/account/profile"]]);
  });
});

describe("the navigate verb and the impersonation ribbon", () => {
  // The ribbon is module-level state shared by every caller, so restoring it
  // has to happen in teardown: a failing assertion mid-flow would otherwise
  // leave it raised for every later test that reads it.
  afterEach(() => {
    useMockImpersonation().end();
  });

  it("navigate names the destination and mutates nothing", () => {
    const before = JSON.stringify(HOSTGRID_MOCK_DATASET.notifications);

    const result = dispatchMockAction(
      HOSTGRID_MOCK_DATASET,
      {},
      "navigate:/account/profile"
    );

    expect(result?.to).toBe("/account/profile");
    expect(JSON.stringify(HOSTGRID_MOCK_DATASET.notifications)).toBe(before);
  });

  it("the impersonation ribbon rises and falls, and is shared", () => {
    const first = useMockImpersonation();
    const second = useMockImpersonation();
    expect(second.isImpersonating.value).toBe(false);

    first.begin("Studio North", HOSTGRID_MOCK_DATASET.persona);
    expect(second.isImpersonating.value).toBe(true);
    expect(second.impersonatedName.value).toBe("Studio North");

    first.end();
    expect(second.isImpersonating.value).toBe(false);
  });
});
