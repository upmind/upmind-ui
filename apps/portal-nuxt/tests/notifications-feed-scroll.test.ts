// -----------------------------------------------------------------------------
/**
 * @module tests/notifications-feed-scroll
 * @description The topbar dropdown is a capped, scrolling feed.
 *
 * It had no height cap and no scroll, so the panel grew with the feed: ten
 * accumulated rows measured ~950px on a 1000px viewport and swallowed the
 * screen. Under it sat a "Load more" button — a second thing to find, below
 * everything the reader had just scrolled past.
 *
 * The rows now scroll inside a capped region and page on reaching its end.
 * What must NOT move is the chrome: the filter rail above and the two controls
 * below stay outside that region, or they scroll away with the feed.
 *
 * Scroll-end paging needs real layout, which jsdom has none of — that half is
 * driven in the browser. This pins the structure the paging hangs off.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { map, range, some } from "lodash-es";
import Notifications from "~/portal/modules/notifications/Notifications.vue";
import { FEED_CLASS } from "~/portal/modules/notifications/variants";

const ITEMS = map(range(10), index => ({
  id: `n-${index}`,
  title: `Notification ${index}`
}));

const BASE = {
  items: ITEMS,
  count: 3,
  label: "Notifications",
  markReadLabel: "Mark all read",
  markReadAction: "mark-notifications-read",
  emptyTitle: "No notifications",
  viewAllTo: "/account/notifications",
  viewAllLabel: "View all"
};

/** The popover renders inline here so the panel is reachable without a click. */
function open(props: Record<string, unknown> = {}) {
  return mount(Notifications, {
    props: { ...BASE, ...props },
    global: {
      stubs: {
        Popover: { template: "<div><slot name='trigger' /><slot /></div>" }
      }
    }
  });
}

describe("the notifications feed is capped and scrolls", () => {
  it("puts the rows in a region that caps its own height", () => {
    const feed = open().find(`.${FEED_CLASS.split(" ").join(".")}`);
    expect(feed.exists()).toBe(true);
    expect(FEED_CLASS).toMatch(/overflow-y-auto/);
    expect(FEED_CLASS).toMatch(/max-h-/);
  });

  it("keeps every row inside that region", () => {
    const wrapper = open();
    const feed = wrapper.find(`.${FEED_CLASS.split(" ").join(".")}`);
    expect(feed.findAll("[data-test-key='portal-notification']")).toHaveLength(
      ITEMS.length
    );
  });

  it("leaves the mark-read and view-all controls outside it, so they never scroll away", () => {
    const wrapper = open();
    const feed = wrapper.find(`.${FEED_CLASS.split(" ").join(".")}`);
    expect(feed.text()).not.toContain("Mark all read");
    expect(feed.text()).not.toContain("View all");
    expect(wrapper.text()).toContain("Mark all read");
    expect(wrapper.text()).toContain("View all");
  });

  it("leaves the filter rail outside it too", () => {
    const wrapper = open({
      filters: [
        { value: "all", label: "All" },
        { value: "unread", label: "Unread" }
      ],
      filterValue: "all",
      filterAction: "notification-filter",
      filterLabel: "Show notifications"
    });
    const feed = wrapper.find(`.${FEED_CLASS.split(" ").join(".")}`);
    expect(feed.text()).not.toContain("Unread");
    expect(wrapper.text()).toContain("Unread");
  });
});

describe("the feed asks for its next page by scrolling, not by a button", () => {
  it("renders no more-rows control even while a next page exists", () => {
    const wrapper = open({
      loadMore: { value: "notification-load-more", label: "Load more" }
    });

    expect(wrapper.text()).not.toContain("Load more");
    expect(
      some(wrapper.findAll("button"), button =>
        button.text().includes("Load more")
      )
    ).toBe(false);
  });

  it("renders an empty feed as a state, with no region to scroll", () => {
    const wrapper = open({ items: [], count: 0 });
    expect(wrapper.find(`.${FEED_CLASS.split(" ").join(".")}`).exists()).toBe(
      false
    );
    expect(wrapper.text()).toContain("No notifications");
  });
});
