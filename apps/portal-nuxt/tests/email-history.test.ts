// -----------------------------------------------------------------------------
/**
 * Legacy's email history under Logs: four status tabs over one list, the
 * subject and recipient per row with the outcome as its badge, and a preview
 * of the message. No client-vue component serves it (its module was retired
 * in FE-3103), so the sandbox mocks it. Oracle: vue-app 1.74.0,
 * `views/client/account/emailHistory` and `components/app/global/emailHistory`.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { SentEmailStatus } from "@upmind-automation/types";
import { boundRefId, rowBinding, stringsIn } from "./support/page-config";
import { every, find, get, includes, map, uniq } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import { CLIENT_VUE_STUB_TITLE } from "~/portal/config/client-vue";
import {
  EMAIL_STATUS_TAB,
  showingEmailTab
} from "~/portal/mock/collection-defs";
import { DATA_REF_ID, dataRef, resolveDataRef } from "~/portal/mock/data-refs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

type ItemLike = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly trailingText?: string;
  readonly to?: string;
};
type TabLike = { readonly value: string; readonly label: string };
type SpecLike = { readonly label: string; readonly value: string };

const DELAY_NOTICE =
  "Please note – it can take up to five minutes for email messages to show in this list.";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function ref<T>(
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: DataRouteContext = {}
): T {
  return resolveDataRef(dataRef(id), hostgrid(), context) as T;
}

describe("email history (legacy emailHistoryTable, emailHistoryStatus, viewEmailModal)", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("puts the list on Logs under the delivery notice, with no client-vue stub", () => {
    const page = accountPages()[PAGE_KEY.ACCOUNT_LOGS];
    expect(includes(stringsIn(page), CLIENT_VUE_STUB_TITLE)).toBe(false);
    const list = rowBinding(page, DATA_REF_ID.SENT_EMAIL_ITEMS);
    expect(get(list, "header.title")).toBe("Email history");
    expect(stringsIn(page)).toContain(DELAY_NOTICE);
    // The notice stands only while the brand says mail is running behind.
    expect(ref<boolean>(DATA_REF_ID.IS_EMAIL_DELIVERY_DELAYED)).toBe(true);
  });

  it("renders the preview page from the header facts and the body", () => {
    const page = accountPages()[PAGE_KEY.ACCOUNT_LOG_EMAIL_DETAIL];
    expect(includes(stringsIn(page), CLIENT_VUE_STUB_TITLE)).toBe(false);
    expect(rowBinding(page, DATA_REF_ID.SENT_EMAIL_SPEC_ITEMS)).toBeDefined();
    const body = rowBinding(page, DATA_REF_ID.SENT_EMAIL_BODY);
    expect(boundRefId(get(body, "slots[0].props"), "markdown")).toBe(
      DATA_REF_ID.SENT_EMAIL_BODY
    );
  });

  it("offers legacy's four tabs, All showing unless the route names another", () => {
    const tabs = ref<TabLike[]>(DATA_REF_ID.SENT_EMAIL_TABS);
    expect(map(tabs, "value")).toEqual([
      EMAIL_STATUS_TAB.ALL,
      EMAIL_STATUS_TAB.SENT,
      EMAIL_STATUS_TAB.BOUNCED,
      EMAIL_STATUS_TAB.FAILED
    ]);
    expect(map(tabs, "label")).toEqual(["All", "Sent", "Bounced", "Failed"]);
    expect(ref<string>(DATA_REF_ID.SENT_EMAIL_STATUS)).toBe(
      EMAIL_STATUS_TAB.ALL
    );
    expect(
      ref<string>(DATA_REF_ID.SENT_EMAIL_STATUS, { status: "bounced" })
    ).toBe(EMAIL_STATUS_TAB.BOUNCED);
    expect(showingEmailTab("nonsense")).toBe(EMAIL_STATUS_TAB.ALL);
  });

  it("rows carry the subject, the recipient and legacy's badge, and open the preview", () => {
    const all = ref<ItemLike[]>(DATA_REF_ID.SENT_EMAIL_ITEMS);
    const invoice = find(all, { id: "mail-2" });
    expect(invoice).toMatchObject({
      title: "Your invoice INV-0091 is ready",
      description: "To: jonah@fieldnotes.app",
      trailingText: "Email sent",
      to: "/account/logs/emails/mail-2"
    });
    // Newest first: the one still sending leads the All tab.
    expect(all[0]?.id).toBe("mail-1");
    expect(all[0]?.trailingText).toBe("Sending");
  });

  it("narrows each tab to its own outcome", () => {
    const sent = ref<ItemLike[]>(DATA_REF_ID.SENT_EMAIL_ITEMS, {
      status: EMAIL_STATUS_TAB.SENT
    });
    expect(sent.length).toBeGreaterThan(0);
    expect(uniq(map(sent, "trailingText"))).toEqual(["Email sent"]);
    const failed = ref<ItemLike[]>(DATA_REF_ID.SENT_EMAIL_ITEMS, {
      status: EMAIL_STATUS_TAB.FAILED
    });
    expect(uniq(map(failed, "trailingText"))).toEqual(["Send failed"]);
    const bounced = ref<ItemLike[]>(DATA_REF_ID.SENT_EMAIL_ITEMS, {
      status: EMAIL_STATUS_TAB.BOUNCED
    });
    expect(uniq(map(bounced, "trailingText"))).toEqual(["Email bounced"]);
    expect(
      every(
        hostgrid().sentEmails,
        email =>
          email.status !== SentEmailStatus.SENDING || email.id === "mail-1"
      )
    ).toBe(true);
  });

  it("previews the header facts legacy's modal shows, dated by the outcome", () => {
    const bounced = ref<SpecLike[]>(DATA_REF_ID.SENT_EMAIL_SPEC_ITEMS, {
      entityId: "mail-4"
    });
    expect(map(bounced, "label")).toEqual([
      "Subject",
      "From",
      "To",
      "CC",
      "Status",
      "Date sent",
      "Date bounced"
    ]);
    expect(find(bounced, { label: "Status" })?.value).toBe("Email bounced");
    expect(find(bounced, { label: "CC" })?.value).toBe("jonah@fieldnotes.app");

    const failed = ref<SpecLike[]>(DATA_REF_ID.SENT_EMAIL_SPEC_ITEMS, {
      entityId: "mail-5"
    });
    expect(map(failed, "label")).toContain("Send failed");
    expect(map(failed, "label")).not.toContain("Date sent");

    expect(
      ref<string>(DATA_REF_ID.SENT_EMAIL_BODY, { entityId: "mail-2" })
    ).toContain("INV-0091");
    expect(
      ref<SpecLike[]>(DATA_REF_ID.SENT_EMAIL_SPEC_ITEMS, { entityId: "nope" })
    ).toEqual([]);
  });

  it("sorts by date or subject and narrows by the sent date, as legacy did", () => {
    const controls = ref<{
      readonly sortOptions?: readonly { readonly value: string }[];
      readonly filters?: readonly { readonly key: string }[];
    }>(DATA_REF_ID.SENT_EMAILS_CONTROLS);
    expect(map(controls.sortOptions, "value")).toEqual([
      "newest",
      "oldest",
      "subject"
    ]);
    expect(map(controls.filters, "key")).toEqual(["dateCreated"]);
  });
});
