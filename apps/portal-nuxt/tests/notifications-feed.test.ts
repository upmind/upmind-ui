// -----------------------------------------------------------------------------
/**
 * @module tests/notifications-feed
 * @description Gap doc §4 "Notifications": the topbar dropdown is legacy's
 * FEED — its own rail of all / read / unread, a per-item dismiss and a
 * load-more that accumulates — while the account page is a paged list beside
 * a read-only preference matrix. They are two surfaces over the same rows, so
 * they get two collection instances: sharing one made the dropdown's Load
 * more advance the page behind it.
 *
 * Dismiss is the one write legacy said nothing back about, and that silence
 * is graded: a toast here would be an invention.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { compact, every, filter, flatMap, map, reject, some } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockDataset, MockNotification } from "~/portal/mock/types";
import type {
  ListModuleItem,
  ListModuleHeading
} from "~/portal/modules/list/types";
import type { NotificationsModuleProps } from "~/portal/modules/notifications/types";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  NOTIFICATION_FILTER,
  notificationFeedCollection,
  notificationsCollection
} from "~/portal/mock/collection-defs";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT = {};

const REQUIRED_TAG = "Required";

function resolveRef(data: MockDataset, id: DataRefId): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value;
}

function feedRows(data: MockDataset): readonly MockNotification[] {
  return notificationFeedCollection.resolve(data).useContext().accumulated
    .value;
}

function pageRows(data: MockDataset): readonly MockNotification[] {
  return notificationsCollection.resolve(data).useContext().data.value;
}

function feedItems(data: MockDataset): ListModuleItem[] {
  return resolveRef(data, DATA_REF_ID.NOTIFICATION_ITEMS) as ListModuleItem[];
}

function preferenceItems(data: MockDataset): ListModuleItem[] {
  return resolveRef(
    data,
    DATA_REF_ID.NOTIFICATION_PREFERENCE_ITEMS
  ) as ListModuleItem[];
}

function unreadBadge(data: MockDataset): number {
  return resolveRef(data, DATA_REF_ID.UNREAD_NOTIFICATION_COUNT) as number;
}

function loadMore(data: MockDataset): NotificationsModuleProps["loadMore"] {
  return resolveRef(
    data,
    DATA_REF_ID.NOTIFICATION_LOAD_MORE
  ) as NotificationsModuleProps["loadMore"];
}

function applyFilter(data: MockDataset, choice: string): void {
  dispatchMockAction(
    data,
    NO_CONTEXT,
    mockActionValue(MOCK_ACTION.NOTIFICATION_FILTER, choice)
  );
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

describe("two surfaces, two instances", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the page's own pager leaves the dropdown where it was", () => {
    const data = hostgrid();
    expect(data.notifications.length).toBeGreaterThan(MOCK_PAGE_LIMIT);

    notificationsCollection.resolve(data).useActions().nextPage();

    expect(
      notificationsCollection.resolve(data).useContext().pagination.value.page
    ).toBe(2);
    expect(
      notificationFeedCollection.resolve(data).useContext().pagination.value
        .page
    ).toBe(1);
  });

  it("the dropdown's load-more leaves the page where it was", () => {
    const data = hostgrid();

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.NOTIFICATION_LOAD_MORE)
    );

    expect(
      notificationFeedCollection.resolve(data).useContext().pagination.value
        .page
    ).toBe(2);
    expect(
      notificationsCollection.resolve(data).useContext().pagination.value.page
    ).toBe(1);
    expect(pageRows(data).length).toBe(MOCK_PAGE_LIMIT);
  });
});

describe("the dropdown's rail — legacy's three choices", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("narrows to what has not been read", () => {
    const data = hostgrid();
    const unread = filter(
      data.notifications,
      notification => !notification.read
    );
    expect(unread.length).toBeGreaterThan(0);
    expect(unread.length).toBeLessThan(data.notifications.length);

    applyFilter(data, NOTIFICATION_FILTER.UNREAD);

    expect(every(feedRows(data), row => !row.read)).toBe(true);
    expect(feedRows(data).length).toBe(
      Math.min(unread.length, MOCK_PAGE_LIMIT)
    );
    expect(feedItems(data).length).toBe(feedRows(data).length);
  });

  it("narrows to what has", () => {
    const data = hostgrid();
    const read = filter(data.notifications, "read");
    expect(read.length).toBeGreaterThan(0);

    applyFilter(data, NOTIFICATION_FILTER.READ);

    expect(every(feedRows(data), "read")).toBe(true);
    expect(feedRows(data).length).toBe(Math.min(read.length, MOCK_PAGE_LIMIT));
  });

  it("restores everything", () => {
    const data = hostgrid();

    applyFilter(data, NOTIFICATION_FILTER.UNREAD);
    applyFilter(data, NOTIFICATION_FILTER.ALL);

    expect(some(feedRows(data), "read")).toBe(true);
    expect(some(feedRows(data), row => !row.read)).toBe(true);
    expect(feedRows(data).length).toBe(MOCK_PAGE_LIMIT);
    expect(resolveRef(data, DATA_REF_ID.NOTIFICATION_FILTER_VALUE)).toBe(
      NOTIFICATION_FILTER.ALL
    );
  });
});

describe("dismiss — the one write that says nothing back", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("drops exactly the row it names, from both surfaces, in silence", () => {
    const data = hostgrid();
    const target = feedRows(data)[0];
    if (target === undefined) throw new Error("seed carries no notifications");
    const before = data.notifications.length;
    expect(map(pageRows(data), "id")).toContain(target.id);
    expect(map(feedItems(data), "id")).toContain(target.id);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.NOTIFICATION_DISMISS, target.id)
    );

    expect(result).toBeDefined();
    expect(result?.toast).toBeUndefined();
    expect(result?.confirm).toBeUndefined();
    expect(result?.to).toBeUndefined();
    expect(data.notifications.length).toBe(before - 1);
    expect(map(feedRows(data), "id")).not.toContain(target.id);
    expect(map(pageRows(data), "id")).not.toContain(target.id);
    expect(map(feedItems(data), "id")).not.toContain(target.id);
  });
});

describe("load more — the feed accumulates, it does not turn a page", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("appends the next page to what is already showing", () => {
    const data = hostgrid();
    const total = data.notifications.length;
    const opening = map(feedRows(data), "id");
    expect(opening.length).toBe(MOCK_PAGE_LIMIT);
    expect(loadMore(data)).toBeDefined();

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.NOTIFICATION_LOAD_MORE)
    );

    const grown = map(feedRows(data), "id");
    expect(grown.length).toBe(Math.min(MOCK_PAGE_LIMIT * 2, total));
    expect(grown.slice(0, MOCK_PAGE_LIMIT)).toEqual(opening);
    expect(feedItems(data).length).toBe(grown.length);
  });

  it("stops offering itself once the whole feed is showing", () => {
    const data = hostgrid();

    for (let index = 0; index < data.notifications.length; index += 1) {
      dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(MOCK_ACTION.NOTIFICATION_LOAD_MORE)
      );
    }

    expect(feedRows(data).length).toBe(data.notifications.length);
    expect(loadMore(data)).toBeUndefined();
  });

  it("mark-all-read still clears the badge", () => {
    const data = hostgrid();
    expect(unreadBadge(data)).toBeGreaterThan(0);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.MARK_NOTIFICATIONS_READ)
    );

    expect(unreadBadge(data)).toBe(0);
    expect(every(feedRows(data), "read")).toBe(true);
  });
});

describe("the preference matrix — stated, never offered", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("is a table of topic against the two channels the brand notifies on", () => {
    const headings = resolveRef(
      hostgrid(),
      DATA_REF_ID.NOTIFICATION_PREFERENCE_HEADINGS
    ) as ListModuleHeading[];

    // A table's headings cover the trailing column its rows carry too, so the
    // named ones are what this grades — in order, and nothing else named.
    expect(compact(map(headings, "label"))).toEqual([
      "Topic",
      "Email",
      "In-app"
    ]);
  });

  it("carries one row per seeded topic, in the seed's own order", () => {
    const data = hostgrid();
    const rows = preferenceItems(data);

    expect(rows.length).toBe(data.notificationPreferences.length);
    expect(map(rows, "title")).toEqual(
      map(data.notificationPreferences, "label")
    );
    for (const row of rows) {
      expect((row.cells ?? []).length).toBe(2);
    }
  });

  it("marks the topics the client cannot opt out of, and only those", () => {
    const data = hostgrid();
    const rows = preferenceItems(data);
    const mandatory = map(
      filter(data.notificationPreferences, "mandatory"),
      "label"
    );
    expect(mandatory.length).toBeGreaterThan(0);
    expect(
      reject(data.notificationPreferences, "mandatory").length
    ).toBeGreaterThan(0);

    const tagged = map(
      filter(rows, row => map(row.tags ?? [], "label").includes(REQUIRED_TAG)),
      "title"
    );

    expect(tagged).toEqual(mandatory);
  });

  it("offers no control at all — changing these is form work", () => {
    const rows = preferenceItems(hostgrid());

    const controls = flatMap(rows, row =>
      compact([
        row.toggle,
        row.action,
        row.secondaryAction,
        ...(row.moreActions ?? [])
      ])
    );

    expect(controls).toEqual([]);
  });
});
