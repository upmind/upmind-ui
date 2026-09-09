import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { gatesOffDataset } from "./support/counter-dataset";
import { find } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { MenuItem } from "~/portal/modules/menu/types";
import type { MetricModuleItem } from "~/portal/modules/metric/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { dispatchMockAction } from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import Composer from "~/portal/modules/composer/Composer.vue";

/**
 * Phases F + G — the account and support pillars (plan §5; legacy
 * src/views/client/{account,support}): the account menu gated as vue-app
 * gated it, page information from the dataset, tickets split by status, the
 * thread keyed off the route's entity, and a WORKING reply through the
 * composer module. Paired blind with tests/composer-reply.must-fail.patch.
 */

function resolveRef(
  dataset: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: Record<string, string> = {}
) {
  return resolveDataRefProps({ value: dataRef(id) }, dataset, context)?.value;
}

describe("account — legacy's menu gates", () => {
  it("hostgrid shows notes, affiliate and child accounts (gates on, and a parent persona)", () => {
    const labels = (
      resolveRef(
        HOSTGRID_MOCK_DATASET,
        DATA_REF_ID.ACCOUNT_SECTION_NAV_ITEMS
      ) as MenuItem[]
    ).map(item => item.label);

    expect(labels).toContain("Notes & secrets");
    expect(labels).toContain("Affiliate");
    expect(labels).toContain("Child accounts");
  });

  it("gates off hides notes and affiliate but shows the child accounts it has", () => {
    const labels = (
      resolveRef(
        gatesOffDataset(),
        DATA_REF_ID.ACCOUNT_SECTION_NAV_ITEMS
      ) as MenuItem[]
    ).map(item => item.label);

    expect(labels).not.toContain("Notes & secrets");
    expect(labels).not.toContain("Affiliate");
    expect(labels).toContain("Child accounts");
  });

  it("the delegate detail resolves the route's entity", () => {
    const spec = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.DELEGATE_SPEC_ITEMS,
      { entityId: "dlg-3" }
    ) as SpecModuleItem[];

    expect(find(spec, { id: "name" })?.value).toBe("Marcus Webb");
    expect(find(spec, { id: "permissions" })?.value).toContain(
      "Manage products"
    );
  });

  it("the affiliate page resolves records where enabled and empties where not", () => {
    const enabled = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.AFFILIATE_STAT_ITEMS
    ) as MetricModuleItem[];
    const disabled = resolveRef(
      gatesOffDataset(),
      DATA_REF_ID.AFFILIATE_STAT_ITEMS
    ) as MetricModuleItem[];

    expect(find(enabled, { label: "Available balance" })?.value).toBe("£42.00");
    expect(disabled).toEqual([]);
  });
});

describe("support — tickets, thread, and the reply", () => {
  afterEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("splits tickets by legacy's Active/Closed tabs, rows linking to the thread", () => {
    // The route's tab narrows one list; absent status reads as Active.
    const open = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.TICKET_ITEMS,
      {}
    ) as ListModuleItem[];
    const closed = resolveRef(HOSTGRID_MOCK_DATASET, DATA_REF_ID.TICKET_ITEMS, {
      status: "closed"
    }) as ListModuleItem[];

    // The hand-authored tickets still lead each status list; the generated
    // tail behind them is what gives each panel its three pages.
    expect(open.map(item => item.id).slice(0, 5)).toEqual([
      "tkt-211",
      "tkt-210",
      "tkt-209",
      "tkt-208",
      "tkt-207"
    ]);
    expect(open[0]?.to).toBe("/support/tickets/tkt-211");
    expect(closed.map(item => item.id).slice(0, 5)).toEqual([
      "tkt-198",
      "tkt-197",
      "tkt-196",
      "tkt-195",
      "tkt-194"
    ]);
    // The two lists never bleed into each other.
    expect(open.every(item => !closed.some(row => row.id === item.id))).toBe(
      true
    );
  });

  it("the support PIN row carries the brand's PIN where enabled and empties where not", () => {
    const withPin = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.SUPPORT_PIN_SPEC_ITEMS
    ) as SpecModuleItem[];
    const withoutPin = resolveRef(
      gatesOffDataset(),
      DATA_REF_ID.SUPPORT_PIN_SPEC_ITEMS
    ) as SpecModuleItem[];

    expect(find(withPin, { id: "pin" })?.value).toBe("4821");
    expect(withoutPin).toEqual([]);
  });

  it("reply-ticket appends the persona's message to the route's ticket — colons in the text survive", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    dispatchMockAction(
      data,
      { entityId: "tkt-207" },
      `reply-ticket:${JSON.stringify({
        body: "Update: still stuck",
        attachments: ""
      })}`
    );

    const ticket = find(data.tickets, { id: "tkt-207" });
    const lastMessage = ticket?.messages.at(-1);
    expect(lastMessage?.body).toBe("Update: still stuck");
    expect(lastMessage?.author).toBe(data.persona.name);
    expect(ticket?.updatedAt).toBe(lastMessage?.sentAt);
  });

  it("mark-notifications-read flips every unread notification", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    dispatchMockAction(data, {}, "mark-notifications-read");

    expect(find(data.notifications, { read: false })).toBeUndefined();
  });
});

describe("composer module — the emit carries the action verb and the model", () => {
  function mountComposer() {
    return mount(Composer, {
      props: {
        label: "Your reply",
        submitLabel: "Send reply",
        action: "reply-ticket",
        attachmentsLabel: "Attachments",
        optionsLabel: "Post options",
        optionsValue: "open-form:support-preferences"
      }
    });
  }

  it("submitting a draft emits `${action}:${json}` and clears the field", async () => {
    const wrapper = mountComposer();

    await wrapper.find("textarea").setValue("It works now, thanks");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("select")).toEqual([
      [
        `reply-ticket:${JSON.stringify({
          body: "It works now, thanks",
          attachments: ""
        })}`
      ]
    ]);
    expect(
      (wrapper.find("textarea").element as HTMLTextAreaElement).value
    ).toBe("");
  });

  it("an empty draft never emits", async () => {
    const wrapper = mountComposer();

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("select")).toBeUndefined();
  });
});
