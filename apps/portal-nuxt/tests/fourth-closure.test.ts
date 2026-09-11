// -----------------------------------------------------------------------------
/**
 * @module tests/fourth-closure
 * @description Phase F8: the six client capabilities the post-F7 audit read
 * as open, and the one staff-only action it read as wrongly offered. A reply
 * carries the files named beside it (B1); the Enter key answers the client's
 * own preference, and the brand's until they give one (B2); a topic's
 * channels move together from one control (B3); a brand that takes part of a
 * balance lets the client say how much (B4) and draw the account's credit on
 * it (B5); a thread about a product reaches that product's notes and secrets
 * (B6); the tax-number check goes back to the desk (B7); a parent lends its
 * appearance only where the brand says so (B8).
 *
 * Every figure is read off a facade output or off the seed — no amount is
 * added up here (plan R6) — and every gate is graded on BOTH seeds, or on the
 * seed plus the same seed with that one key moved, so nothing passes on a
 * single dataset's say-so (plan R9).
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import {
  BrandConfigKeys,
  NotificationChannelCodes
} from "@upmind-automation/types";
import { boundRefId, rowBinding } from "./support/page-config";
import {
  assign,
  cloneDeep,
  compact,
  every,
  filter,
  find,
  first,
  get,
  includes,
  map,
  reject,
  size,
  some,
  values
} from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockBrandFeatures,
  MockDataset,
  MockNotificationPreference,
  MockTicket
} from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { ContentConfig } from "~/portal/types";
import { accountPages } from "~/portal/config/account-pages";
import { productPages } from "~/portal/config/product-pages";
import { supportPages } from "~/portal/config/support-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import * as supportSchemas from "~/portal/mock/contracts/client-tickets.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  MOCK_RECEIPT_REASON,
  canReplyToTicket,
  isTicketClosed,
  isTicketLocked,
  newLineKey,
  submitsWithShortcut,
  useMockNotifications,
  useMockPersonalDetails,
  useMockTicket
} from "~/portal/mock/facades";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { supportPreferencesContext } from "~/portal/mock/forms/support-contexts";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import {
  BRAND_GATE_CONFIG_KEY,
  MOCK_ENTER_KEY_ACTION
} from "~/portal/mock/types";
import Composer from "~/portal/modules/composer/Composer.vue";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const CHANNELS = [
  NotificationChannelCodes.EMAIL,
  NotificationChannelCodes.IN_APP
] as const;

const REPLY_BODY = "Both logs are attached — the second one has the stack.";

const ATTACHMENT_NAMES = "region-two.log, trace.json";

/** What the composer hands the dispatcher: the raw field, split by the write. */
const ATTACHMENTS_STORED = ["region-two.log", "trace.json"];

type ActionLike = {
  readonly value: string;
  readonly label: string;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function bothSeeds(): MockDataset[] {
  return [hostgrid(), minimal()];
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

/**
 * The same seed with one gate moved — R9's other branch where a seed has no
 * twin. Deep-cloned: a shallow copy shares every collection with the live
 * dataset, so a write driven through the variant lands on the seed itself.
 */
function withFeatures(
  data: MockDataset,
  overrides: Partial<MockBrandFeatures>
): MockDataset {
  const copy = cloneDeep(data);
  return assign(copy, {
    features: assign({}, copy.features, overrides)
  });
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result?.toast?.title ?? ""} ${result?.toast?.description ?? ""}`;
}

function payload(verb: string, model: unknown): string {
  return `${verb}:${JSON.stringify(model)}`;
}

function refusalOf(reason: keyof typeof MOCK_REFUSAL_MESSAGE): string {
  return MOCK_REFUSAL_MESSAGE[reason];
}

// -----------------------------------------------------------------------------
// B1 — the files named beside a reply
// -----------------------------------------------------------------------------

function threadPage(): ContentConfig | undefined {
  return supportPages()[PAGE_KEY.SUPPORT_TICKET_DETAIL];
}

function composerProps(): ConfigNode {
  const row = rowBinding(
    threadPage(),
    DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT
  );
  const slot = get(row, "slots[0]");
  const props = get(slot, "props");
  if (props === undefined) throw new Error("the thread page binds no composer");
  return props as ConfigNode;
}

function composerRow(): ConfigNode {
  const row = rowBinding(
    threadPage(),
    DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT
  );
  if (row === undefined) throw new Error("the thread page binds no composer");
  return row;
}

function openThread(data: MockDataset): MockTicket {
  const ticket = find(
    data.tickets,
    candidate => candidate.closedAt === undefined
  );
  if (ticket === undefined) throw new Error("seed carries no open thread");
  return ticket;
}

function closedThread(data: MockDataset): MockTicket {
  const ticket = find(
    data.tickets,
    candidate => candidate.closedAt !== undefined
  );
  if (ticket === undefined) throw new Error("seed carries no closed thread");
  return ticket;
}

function mountComposer(props: Record<string, unknown> = {}) {
  return mount(Composer, {
    props: assign(
      {
        label: "Your reply",
        submitLabel: "Send reply",
        action: MOCK_ACTION.REPLY_TICKET,
        attachmentsLabel: "Attachments",
        optionsLabel: "Post options",
        optionsValue: mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          FORM_ID.SUPPORT_PREFERENCES
        )
      },
      props
    )
  });
}

describe("B1 — the reply that carries the files named beside it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks for the names in the same one field the new-ticket form asks in", () => {
    const data = hostgrid();
    const props = composerProps();
    const ticketField = get(
      supportSchemas.useSchema({
        departments: map(data.departments, department => ({
          id: department.id,
          name: department.name
        })),
        canSchedule: data.features.CLIENT_TICKET_SCHEDULING_ENABLED
      }),
      "properties.attachments"
    );

    expect(props.attachmentsLabel).toBeTruthy();
    expect(props.action).toBe(MOCK_ACTION.REPLY_TICKET);
    // One free-text field of comma-separated names on both, so a client who
    // has raised a thread already knows how to answer this one.
    expect(get(ticketField, "type")).toBe("string");
    expect(props.attachmentsPlaceholder).toContain(",");
  });

  it("emits the verb with the body and the names, and clears the box", async () => {
    const wrapper = mountComposer();

    await wrapper.find("textarea").setValue(REPLY_BODY);
    await wrapper.find("input").setValue(ATTACHMENT_NAMES);
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("select")).toEqual([
      [
        payload(MOCK_ACTION.REPLY_TICKET, {
          body: REPLY_BODY,
          attachments: ATTACHMENT_NAMES
        })
      ]
    ]);
    expect(
      (wrapper.find("textarea").element as HTMLTextAreaElement).value
    ).toBe("");
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("");
  });

  it("stores the names on the new message, and none where none were given", () => {
    const data = hostgrid();
    const thread = openThread(data);
    const before = size(thread.messages);

    const sent = dispatchMockAction(
      data,
      { entityId: thread.id },
      payload(MOCK_ACTION.REPLY_TICKET, {
        body: REPLY_BODY,
        attachments: ATTACHMENT_NAMES
      })
    );

    const withFiles = find(data.tickets, { id: thread.id })?.messages.at(-1);
    expect(sent?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(size(find(data.tickets, { id: thread.id })?.messages)).toBe(
      before + 1
    );
    expect(withFiles?.body).toBe(REPLY_BODY);
    expect(withFiles?.author).toBe(data.persona.name);
    expect(withFiles?.attachments).toEqual(ATTACHMENTS_STORED);

    dispatchMockAction(
      data,
      { entityId: thread.id },
      payload(MOCK_ACTION.REPLY_TICKET, { body: REPLY_BODY, attachments: "" })
    );

    const bare = find(data.tickets, { id: thread.id })?.messages.at(-1);
    expect(bare?.attachments ?? []).toEqual([]);
    // The earlier message keeps its own names — a second reply is not a rewrite.
    expect(
      find(data.tickets, { id: thread.id })?.messages.at(-2)?.attachments
    ).toEqual(ATTACHMENTS_STORED);
  });

  it("takes the box away on a finished thread, so no reply is offered at all", () => {
    const data = hostgrid();
    const closed = closedThread(data);
    const open = openThread(data);

    expect(boundRefId(composerRow(), "visible")).toBe(
      DATA_REF_ID.TICKET_IS_OPEN
    );
    expect(
      ref<boolean>(data, DATA_REF_ID.TICKET_IS_OPEN, { entityId: closed.id })
    ).toBe(false);
    expect(
      ref<boolean>(data, DATA_REF_ID.TICKET_IS_OPEN, { entityId: open.id })
    ).toBe(true);
  });

  it("shows the reply in the thread once it has landed", () => {
    const data = hostgrid();
    const thread = openThread(data);

    dispatchMockAction(
      data,
      { entityId: thread.id },
      payload(MOCK_ACTION.REPLY_TICKET, {
        body: REPLY_BODY,
        attachments: ATTACHMENT_NAMES
      })
    );

    const posted = ref<ListModuleItem[]>(
      data,
      DATA_REF_ID.TICKET_MESSAGE_ITEMS,
      { entityId: thread.id }
    ).at(-1);
    expect(posted?.title).toBe(data.persona.name);
    expect(posted?.description).toContain(REPLY_BODY);
    for (const name of ATTACHMENTS_STORED) {
      expect(posted?.description).toContain(name);
    }

    dispatchMockAction(
      data,
      { entityId: thread.id },
      payload(MOCK_ACTION.REPLY_TICKET, { body: REPLY_BODY, attachments: "" })
    );

    const bare = ref<ListModuleItem[]>(data, DATA_REF_ID.TICKET_MESSAGE_ITEMS, {
      entityId: thread.id
    }).at(-1);
    expect(bare?.description).toBe(REPLY_BODY);
  });
});

// -----------------------------------------------------------------------------
// B1a — the thread that takes no reply at all
// -----------------------------------------------------------------------------

function lockedThread(data: MockDataset): MockTicket {
  const ticket = find(
    data.tickets,
    candidate => isTicketLocked(candidate) && !isTicketClosed(candidate)
  );
  if (ticket === undefined) {
    throw new Error("seed carries no desk-locked thread that is still open");
  }
  return ticket;
}

function replyActions(data: MockDataset, ticketId: string) {
  return useMockTicket(data, ticketId).useActions();
}

/** Every message on the thread, as it stands — compared whole, not counted. */
function messagesOn(data: MockDataset, ticketId: string): string {
  return JSON.stringify(find(data.tickets, { id: ticketId })?.messages);
}

describe("B1a — the reply a finished or locked thread refuses before it writes", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("names why each thread takes no reply, beside the other write guards", () => {
    const data = hostgrid();
    const closed = closedThread(data);
    const locked = lockedThread(data);
    const open = openThread(data);

    // All three are on the seed, so a guard that answers one way always
    // cannot pass this.
    expect(replyActions(data, closed.id).whyNotReplyable()).toMatchObject({
      ok: false,
      reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED
    });
    expect(replyActions(data, locked.id).whyNotReplyable()).toMatchObject({
      ok: false,
      reason: MOCK_RECEIPT_REASON.LOCKED
    });
    expect(replyActions(data, open.id).whyNotReplyable()).toBeUndefined();
    expect(
      map([closed, locked, open], candidate => canReplyToTicket(candidate))
    ).toEqual([false, false, true]);
    expect(refusalOf(MOCK_RECEIPT_REASON.ALREADY_CLOSED)).not.toBe(
      refusalOf(MOCK_RECEIPT_REASON.LOCKED)
    );
  });

  it("the guard and the write agree on every thread the seed carries", () => {
    const data = hostgrid();

    for (const ticket of data.tickets) {
      const refusal = replyActions(data, ticket.id).whyNotReplyable();

      expect([ticket.id, refusal === undefined]).toEqual([
        ticket.id,
        canReplyToTicket(ticket)
      ]);
    }
  });

  it("refuses a finished thread, and leaves its messages exactly as they were", () => {
    const data = hostgrid();
    const closed = closedThread(data);
    const stood = messagesOn(data, closed.id);

    const receipt = replyActions(data, closed.id).reply({
      body: REPLY_BODY,
      attachments: [ATTACHMENT_NAMES]
    });

    expect(receipt?.ok).toBe(false);
    expect(receipt?.reason).toBe(MOCK_RECEIPT_REASON.ALREADY_CLOSED);
    expect(messagesOn(data, closed.id)).toBe(stood);
    expect(find(data.tickets, { id: closed.id })?.updatedAt).toBe(
      closed.updatedAt
    );
  });

  it("refuses a desk-locked thread, and leaves its messages exactly as they were", () => {
    const data = hostgrid();
    const locked = lockedThread(data);
    const stood = messagesOn(data, locked.id);

    const receipt = replyActions(data, locked.id).reply({
      body: REPLY_BODY,
      attachments: [ATTACHMENT_NAMES]
    });

    expect(receipt?.ok).toBe(false);
    expect(receipt?.reason).toBe(MOCK_RECEIPT_REASON.LOCKED);
    expect(messagesOn(data, locked.id)).toBe(stood);
  });

  it("answers the door with one warning naming the refusal, and writes nothing", () => {
    const data = hostgrid();

    for (const [ticket, reason] of [
      [closedThread(data), MOCK_RECEIPT_REASON.ALREADY_CLOSED],
      [lockedThread(data), MOCK_RECEIPT_REASON.LOCKED]
    ] as const) {
      const stood = messagesOn(data, ticket.id);

      const result = dispatchMockAction(
        data,
        { entityId: ticket.id },
        payload(MOCK_ACTION.REPLY_TICKET, {
          body: REPLY_BODY,
          attachments: ATTACHMENT_NAMES
        })
      );

      expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
      expect(result?.toast?.title).toBe(refusalOf(reason));
      expect(result?.toast?.description).toBeUndefined();
      expect(result?.confirm).toBeUndefined();
      expect(result?.form).toBeUndefined();
      expect(messagesOn(data, ticket.id)).toBe(stood);
    }
  });

  it("still takes the reply on a thread that is neither, so the guard is not a blanket", () => {
    const data = hostgrid();
    const open = openThread(data);
    const stood = messagesOn(data, open.id);

    const result = dispatchMockAction(
      data,
      { entityId: open.id },
      payload(MOCK_ACTION.REPLY_TICKET, {
        body: REPLY_BODY,
        attachments: ATTACHMENT_NAMES
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(messagesOn(data, open.id)).not.toBe(stood);
    expect(
      find(data.tickets, { id: open.id })?.messages.at(-1)?.attachments
    ).toEqual(ATTACHMENTS_STORED);
  });
});

// -----------------------------------------------------------------------------
// B2 — what the Enter key does, and who decides it
// -----------------------------------------------------------------------------

function preferencesForm(data: MockDataset) {
  return resolveMockForm(data, FORM_ID.SUPPORT_PREFERENCES, undefined);
}

function savePreference(submitWithShortcut: boolean): string {
  return payload(MOCK_ACTION.SUPPORT_PREFERENCES_SAVE, { submitWithShortcut });
}

describe("B2 — the Enter key answers the client, then the brand", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("reads the brand's own key while the client has said nothing", () => {
    const sends = hostgrid();
    const opens = minimal();

    expect(sends.persona.supportPreferences).toBeUndefined();
    expect(opens.persona.supportPreferences).toBeUndefined();
    expect(sends.features.UI_ENTER_KEY_ACTION).toBe(
      MOCK_ENTER_KEY_ACTION.SUBMIT
    );
    expect(opens.features.UI_ENTER_KEY_ACTION).toBe(
      MOCK_ENTER_KEY_ACTION.NEWLINE
    );
    expect(map(bothSeeds(), submitsWithShortcut)).toEqual([true, false]);
    expect(
      map(bothSeeds(), data =>
        ref<boolean>(data, DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT)
      )
    ).toEqual([true, false]);
  });

  it("reads the client's own answer once given, against the brand on both seeds", () => {
    for (const data of bothSeeds()) {
      const brand = submitsWithShortcut(data);

      useMockPersonalDetails(data)
        .useActions()
        .saveSupportPreferences({
          submitWithShortcut: !brand,
          newLineKey: newLineKey(data)
        });

      expect(submitsWithShortcut(data)).toBe(!brand);
      expect(
        ref<boolean>(data, DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT)
      ).toBe(!brand);
      // The brand key never moved — the answer sits on the persona.
      expect(data.features.UI_ENTER_KEY_ACTION).toBe(
        brand ? MOCK_ENTER_KEY_ACTION.SUBMIT : MOCK_ENTER_KEY_ACTION.NEWLINE
      );
    }
  });

  it("offers the post-options control, which opens the one-question form", () => {
    const data = hostgrid();
    const props = composerProps();
    const optionsValue = mockActionValue(
      MOCK_ACTION.OPEN_FORM,
      FORM_ID.SUPPORT_PREFERENCES
    );
    const form = preferencesForm(data);

    expect(props.optionsLabel).toBeTruthy();
    expect(props.optionsValue).toBe(optionsValue);
    expect(dispatchMockAction(data, NO_CONTEXT, optionsValue)?.form).toEqual({
      id: FORM_ID.SUPPORT_PREFERENCES
    });
    expect(Object.keys(get(form, "schema.properties", {}))).toEqual([
      "newLineKey",
      "submitWithShortcut"
    ]);
    expect(get(form, "schema.properties.submitWithShortcut.type")).toBe(
      "boolean"
    );
    expect(get(form, "schema.properties.submitWithShortcut.title")).toBe(
      "Send with the other key"
    );
    expect(form?.submit).toBe(MOCK_ACTION.SUPPORT_PREFERENCES_SAVE);
    expect(form?.model).toEqual(supportPreferencesContext(data));
  });

  it("saves the answer through the verb, and opens on it next time", () => {
    const data = hostgrid();
    const opening = submitsWithShortcut(data);
    const openingNewLine = newLineKey(data);

    const saved = dispatchMockAction(
      data,
      NO_CONTEXT,
      savePreference(!opening)
    );

    expect(saved?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.persona.supportPreferences).toEqual({
      submitWithShortcut: !opening,
      newLineKey: openingNewLine
    });
    expect(preferencesForm(data)?.model).toEqual({
      submitWithShortcut: !opening,
      newLineKey: openingNewLine
    });
    expect(
      ref<boolean>(data, DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT)
    ).toBe(!opening);
  });

  it("sends on Enter only where the flag is on, and never on Shift and Enter", async () => {
    const sends = mountComposer({ submitWithShortcut: true });
    await sends.find("textarea").setValue(REPLY_BODY);
    await sends.find("textarea").trigger("keydown", { key: "Enter" });

    expect(size(sends.emitted("select"))).toBe(1);

    const opens = mountComposer({ submitWithShortcut: false });
    await opens.find("textarea").setValue(REPLY_BODY);
    await opens.find("textarea").trigger("keydown", { key: "Enter" });

    expect(opens.emitted("select")).toBeUndefined();
    // …and the control still sends, so the key is the only thing that moved.
    await opens.find("form").trigger("submit");
    expect(size(opens.emitted("select"))).toBe(1);

    const held = mountComposer({ submitWithShortcut: true });
    await held.find("textarea").setValue(REPLY_BODY);
    await held
      .find("textarea")
      .trigger("keydown", { key: "Enter", shiftKey: true });

    expect(held.emitted("select")).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// B3 — a topic's channels, moved together
// -----------------------------------------------------------------------------

function topicActions(data: MockDataset): ActionLike[] {
  return ref<ActionLike[]>(data, DATA_REF_ID.NOTIFICATION_TOPIC_ACTIONS) ?? [];
}

function topicValue(topicId: string, on: boolean): string {
  return mockActionValue(
    MOCK_ACTION.NOTIFICATION_TOPIC_SET,
    `${topicId}:${on ? "on" : "off"}`
  );
}

function topicOf(
  data: MockDataset,
  topicId: string
): MockNotificationPreference {
  const row = find(data.notificationPreferences, { topic: topicId });
  if (row === undefined) throw new Error(`no topic ${topicId} on this seed`);
  return row;
}

function preferenceModel(data: MockDataset): Record<string, boolean> {
  return ref<Record<string, boolean>>(
    data,
    DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
  );
}

function allOn(row: MockNotificationPreference): boolean {
  return every(CHANNELS, channel => row.channels[channel]);
}

/** A client topic whose channels ALL read the same way — the only row a one-channel write cannot hide behind. */
function uniformTopic(
  data: MockDataset,
  standing: boolean
): MockNotificationPreference {
  const row = find(
    data.notificationPreferences,
    candidate =>
      !candidate.mandatory &&
      every(CHANNELS, channel => candidate.channels[channel] === standing)
  );
  if (row === undefined) {
    throw new Error(`seed carries no client topic wholly ${standing}`);
  }
  return row;
}

/** Every other topic's channels, as they stand — the untouched half of the matrix. */
function channelsBesides(data: MockDataset, topicId: string): unknown[] {
  return map(reject(data.notificationPreferences, { topic: topicId }), row => [
    row.topic,
    map(CHANNELS, channel => row.channels[channel])
  ]);
}

describe("B3 — one control per topic the client may answer", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("offers one control per client topic and none on the brand's own", () => {
    for (const data of bothSeeds()) {
      const client = reject(data.notificationPreferences, { mandatory: true });
      const brands = filter(data.notificationPreferences, { mandatory: true });

      // Both kinds are on the page, so neither an empty list nor one control
      // per topic can pass this.
      expect(size(client)).toBeGreaterThan(0);
      expect(size(brands)).toBeGreaterThan(0);
      expect(map(topicActions(data), "value")).toEqual(
        map(client, row => topicValue(row.topic, !allOn(row)))
      );
      expect(map(topicActions(data), "label")).toEqual(
        map(
          client,
          row => `${allOn(row) ? "Clear all" : "Select all"} — ${row.label}`
        )
      );
      expect(
        filter(topicActions(data), entry =>
          some(brands, row => includes(entry.value, row.topic))
        )
      ).toEqual([]);
    }
  });

  it("follows the state it just wrote — the same control turns around", () => {
    const data = hostgrid();
    const row = find(
      data.notificationPreferences,
      candidate => allOn(candidate) && !candidate.mandatory
    );
    if (row === undefined)
      throw new Error("seed carries no fully-on client topic");
    const clearing = find(topicActions(data), entry =>
      includes(entry.value, row.topic)
    );

    const cleared = dispatchMockAction(data, NO_CONTEXT, clearing?.value ?? "");

    expect(clearing?.value).toBe(topicValue(row.topic, false));
    expect(cleared?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(topicOf(data, row.topic).channels).toEqual(
      assign({}, ...map(CHANNELS, channel => ({ [channel]: false })))
    );
    expect(
      find(topicActions(data), entry => includes(entry.value, row.topic))
    ).toEqual({
      value: topicValue(row.topic, true),
      label: `Select all — ${row.label}`
    });
  });

  it("sets every channel of the topic it names, and no other topic's", () => {
    const data = hostgrid();
    // A topic whose channels ALL stand opposite the answer being written, so a
    // write that moves one of them and stops leaves the other visibly wrong.
    const rows = [
      [uniformTopic(data, false), true],
      [uniformTopic(data, true), false]
    ] as const;

    for (const [row, receives] of rows) {
      const others = channelsBesides(data, row.topic);

      const receipt = useMockNotifications(data)
        .useActions()
        .setTopic(row.topic, receives);

      expect([row.topic, receipt?.ok]).toEqual([row.topic, true]);
      expect(
        map(CHANNELS, channel => topicOf(data, row.topic).channels[channel])
      ).toEqual(map(CHANNELS, () => receives));
      expect(channelsBesides(data, row.topic)).toEqual(others);
    }
  });

  it("the matrix form re-reads the values the control wrote", () => {
    const data = hostgrid();
    const row = find(
      data.notificationPreferences,
      candidate => !candidate.mandatory && !allOn(candidate)
    );
    if (row === undefined)
      throw new Error("seed carries no part-off client topic");
    const before = preferenceModel(data);

    dispatchMockAction(data, NO_CONTEXT, topicValue(row.topic, true));

    const after = preferenceModel(data);
    expect(
      map(CHANNELS, channel => get(before, `${row.topic}__${channel}`))
    ).not.toEqual([true, true]);
    expect(
      map(CHANNELS, channel => get(after, `${row.topic}__${channel}`))
    ).toEqual(
      map(CHANNELS, channel => topicOf(data, row.topic).channels[channel])
    );
    expect(
      map(CHANNELS, channel => get(after, `${row.topic}__${channel}`))
    ).toEqual([true, true]);
  });

  it("refuses the brand's own topic in its own words, and moves nothing", () => {
    const data = hostgrid();
    const brands = find(data.notificationPreferences, { mandatory: true });
    if (brands === undefined)
      throw new Error("seed carries no mandatory topic");
    const stood = assign({}, brands.channels);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      topicValue(brands.topic, !allOn(brands))
    );

    expect(result?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain(
      refusalOf(MOCK_RECEIPT_REASON.TOPIC_MANDATORY)
    );
    expect(topicOf(data, brands.topic).channels).toEqual(stood);
    expect(
      useMockNotifications(data).useActions().setTopic(brands.topic, false)
        ?.reason
    ).toBe(MOCK_RECEIPT_REASON.TOPIC_MANDATORY);
    expect(topicOf(data, brands.topic).channels).toEqual(stood);
  });
});

// -----------------------------------------------------------------------------
// B4 — settling part of a balance
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// B5 — drawing on the account's own credit
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// B6 — the thread that reaches its product's own notes
// -----------------------------------------------------------------------------

function relatedLinks(data: MockDataset, ticketId: string): ActionLike[] {
  return (
    ref<ActionLike[]>(data, DATA_REF_ID.TICKET_RELATED_PRODUCT_LINKS, {
      entityId: ticketId
    }) ?? []
  );
}

function threadAboutProduct(data: MockDataset): MockTicket {
  const ticket = find(
    data.tickets,
    candidate => candidate.productId !== undefined
  );
  if (ticket === undefined)
    throw new Error("seed carries no thread about a product");
  return ticket;
}

function anchorsOn(page: ContentConfig | undefined): string[] {
  return compact(map(page?.rows ?? [], row => row.anchor));
}

describe("B6 — the thread's product, and the panels it points at", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("offers both links, each landing on that product's own panel", () => {
    const data = hostgrid();
    const thread = threadAboutProduct(data);
    const product = find(data.products, { id: thread.productId });
    const destination = `/${product?.groupSlug}/${thread.productId}`;

    expect(data.features.CLIENT_NOTES_AND_SECRETS_ENABLED).toBe(true);
    expect(relatedLinks(data, thread.id)).toEqual([
      {
        value: mockActionValue(MOCK_ACTION.NAVIGATE, `${destination}#notes`),
        label: "Show notes"
      },
      {
        value: mockActionValue(MOCK_ACTION.NAVIGATE, `${destination}#secrets`),
        label: "Show secrets"
      }
    ]);
    expect(
      ref<boolean>(data, DATA_REF_ID.TICKET_HAS_RELATED_PRODUCT_LINKS, {
        entityId: thread.id
      })
    ).toBe(true);
  });

  it("offers nothing where the brand keeps no notes, and nothing on a bare thread", () => {
    const data = hostgrid();
    const thread = threadAboutProduct(data);
    const bare = find(
      data.tickets,
      candidate => candidate.productId === undefined
    );
    if (bare === undefined)
      throw new Error("seed carries no thread about no product");
    const gated = withFeatures(data, {
      CLIENT_NOTES_AND_SECRETS_ENABLED: false
    });

    expect(size(relatedLinks(data, thread.id))).toBeGreaterThan(0);
    expect(relatedLinks(gated, thread.id)).toEqual([]);
    expect(
      ref<boolean>(gated, DATA_REF_ID.TICKET_HAS_RELATED_PRODUCT_LINKS, {
        entityId: thread.id
      })
    ).toBe(false);
    expect(relatedLinks(data, bare.id)).toEqual([]);
    // The minimal brand sits on the same side of the key.
    expect(minimal().features.CLIENT_NOTES_AND_SECRETS_ENABLED).toBe(false);
  });

  it("gives the product page the two panels those links land on", () => {
    const page = productPages()[PAGE_KEY.PRODUCT_DETAIL];

    expect(anchorsOn(page)).toEqual(
      expect.arrayContaining(["notes", "secrets"])
    );
    expect(
      map(
        filter(page?.rows ?? [], row =>
          includes(["notes", "secrets"], row.anchor)
        ),
        row => row.anchor
      )
    ).toEqual(["notes", "secrets"]);
  });
});

// -----------------------------------------------------------------------------
// B7 — the tax check that went back to the desk
// -----------------------------------------------------------------------------

describe("B7 — the tax-number check the client's own area never carried", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("refuses the verb outright, in one warning and nothing else, on both seeds", () => {
    for (const data of bothSeeds()) {
      const subject = first(data.companies)?.id ?? "co-none";
      const before = JSON.stringify(data.companies);

      const result = dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(MOCK_ACTION.COMPANY_VALIDATE_TAX, subject)
      );

      expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
      expect(result?.toast?.title).toBe(
        refusalOf(MOCK_RECEIPT_REASON.NOT_PERMITTED)
      );
      expect(result?.toast?.description).toBeUndefined();
      expect(result?.confirm).toBeUndefined();
      expect(result?.form).toBeUndefined();
      expect(JSON.stringify(data.companies)).toBe(before);
    }
  });
});

// -----------------------------------------------------------------------------
// B8 — the appearance a parent lends its children
// -----------------------------------------------------------------------------

function brandingPage(): ContentConfig | undefined {
  return accountPages()[PAGE_KEY.ACCOUNT_CHILD_ACCOUNTS];
}

describe("B8 — the parent's appearance, behind the brand's own key", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("shows the panel only where the brand lends an appearance and there is one", () => {
    const data = hostgrid();
    const lent = withFeatures(data, { UI_PARENT_BRANDING_ENABLED: true });
    const withheld = withFeatures(data, { UI_PARENT_BRANDING_ENABLED: false });
    const bare = withFeatures(minimal(), {
      UI_PARENT_BRANDING_ENABLED: true
    });

    expect(data.features.UI_PARENT_BRANDING_ENABLED).toBe(true);
    expect(minimal().features.UI_PARENT_BRANDING_ENABLED).toBe(false);
    expect(lent.parentBranding).not.toBeNull();
    expect(bare.parentBranding).toBeNull();
    expect(ref<boolean>(lent, DATA_REF_ID.HAS_PARENT_BRANDING)).toBe(true);
    // The key alone takes it away, on a seed that HAS an appearance to lend.
    expect(ref<boolean>(withheld, DATA_REF_ID.HAS_PARENT_BRANDING)).toBe(false);
    // …and the key alone is not enough where there is nothing to lend.
    expect(ref<boolean>(bare, DATA_REF_ID.HAS_PARENT_BRANDING)).toBe(false);
    expect(ref<boolean>(minimal(), DATA_REF_ID.HAS_PARENT_BRANDING)).toBe(
      false
    );
  });

  it("hangs the panel's own presence on that gate", () => {
    const row = rowBinding(brandingPage(), DATA_REF_ID.PARENT_BRANDING_ITEMS);

    expect(boundRefId(row, "visible")).toBe(DATA_REF_ID.HAS_PARENT_BRANDING);
  });
});

// -----------------------------------------------------------------------------
// B9 — the four keys this phase bound
// -----------------------------------------------------------------------------

const F8_GATES = [
  "PARTIAL_PAYMENTS_ENABLED",
  "TAX_NUMBER_VALIDATION_ENABLED",
  "UI_PARENT_BRANDING_ENABLED",
  "UI_ENTER_KEY_ACTION"
] as const;

describe("the gates this phase bound are the platform's own keys", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("reads each of the four through a real BrandConfigKeys member", () => {
    expect(map(F8_GATES, gate => BRAND_GATE_CONFIG_KEY[gate])).toEqual([
      BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
      BrandConfigKeys.TAX_NUMBER_VALIDATION_ENABLED,
      BrandConfigKeys.UI_PARENT_BRANDING_ENABLED,
      BrandConfigKeys.UI_ENTER_KEY_ACTION
    ]);
    expect(
      every(F8_GATES, gate =>
        includes(values(BrandConfigKeys), BRAND_GATE_CONFIG_KEY[gate])
      )
    ).toBe(true);
  });

  it("seeds the two brands on opposite sides of every one of them", () => {
    const on = hostgrid().features;
    const off = minimal().features;

    expect(map(F8_GATES, gate => on[gate])).toEqual([
      true,
      true,
      true,
      MOCK_ENTER_KEY_ACTION.SUBMIT
    ]);
    expect(map(F8_GATES, gate => off[gate])).toEqual([
      false,
      false,
      false,
      MOCK_ENTER_KEY_ACTION.NEWLINE
    ]);
    expect(map(F8_GATES, gate => on[gate] === off[gate])).toEqual([
      false,
      false,
      false,
      false
    ]);
  });
});
