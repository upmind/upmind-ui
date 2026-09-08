// -----------------------------------------------------------------------------
/**
 * @module tests/ticket-forms
 * @description Gap doc §5 / plan §3 rows "New ticket" and "Edit ticket
 * subject": the page that only announced itself now opens threads, and a
 * thread the desk still admits changes to can be renamed (plan F1, F9, F12).
 * The department control is a fact about the BRAND rather than a rule, so it
 * is graded on both datasets; the first message is the client's own, and the
 * files named on it are names, never content. `ticket-actions.test.ts` grades
 * what a thread admits; this grades opening one and renaming one.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { TicketStatusCodes } from "@upmind-automation/types";
import { boundRefId, stringsIn } from "./support/page-config";
import { filter, find, get, map, max, reject } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockTicket } from "~/portal/mock/types";
import { supportPages } from "~/portal/config/support-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import * as ticketSchemas from "~/portal/mock/contracts/client-tickets.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { ticketFormContext } from "~/portal/mock/forms/support-contexts";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const SUBJECT = "Kestrel deploy hangs on the second region";

const BODY = "It stops at 40% and the log ends there. Retried twice.";

const ATTACHMENTS = "deploy.log, region-two.png";

const ATTACHMENT_NAMES = ["deploy.log", "region-two.png"];

const RENAMED = "Kestrel deploy — second region only";

type ActionLike = { readonly value: string; readonly label: string };

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

/** The dataset whose brand publishes ONE desk — the department gate's OFF branch. */
function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function newTicketPage(): unknown {
  return supportPages()[PAGE_KEY.SUPPORT_TICKET_NEW];
}

function modules(page: unknown): ConfigNode[] {
  const rows = get(page, "rows");
  if (!Array.isArray(rows)) throw new Error("the new-ticket page has no rows");
  return rows.flatMap(row => {
    const slots = get(row, "slots");
    return Array.isArray(slots) ? (slots as ConfigNode[]) : [];
  });
}

function formProps(page: unknown): ConfigNode {
  const props = get(modules(page)[0], "props");
  if (typeof props !== "object" || props === null) {
    throw new Error("the new-ticket page binds no form");
  }
  return props as ConfigNode;
}

function schemaFor(data: MockDataset, context: DataRouteContext = {}) {
  return ticketSchemas.useSchema(ticketFormContext(data, context));
}

function controlAt(data: MockDataset, scope: string) {
  return find(ticketSchemas.useUischema(ticketFormContext(data, {})).elements, {
    scope
  });
}

function highestReference(data: MockDataset): number {
  const numbers = map(data.tickets, ticket =>
    Number((ticket.reference ?? "").replace(/\D/g, ""))
  );
  return max(filter(numbers, value => value > 0)) ?? 0;
}

function ticketBy(
  data: MockDataset,
  trait: string,
  matches: (ticket: MockTicket) => boolean
): MockTicket {
  const ticket = find(data.tickets, matches);
  if (ticket === undefined) throw new Error(`seed carries no ${trait}`);
  return ticket;
}

function manageValues(data: MockDataset, ticketId: string): string[] {
  return map(
    ref<ActionLike[]>(data, DATA_REF_ID.TICKET_MANAGE_ACTIONS, {
      entityId: ticketId
    }) ?? [],
    "value"
  );
}

function renameValue(ticketId: string): string {
  return mockActionValue(
    MOCK_ACTION.OPEN_FORM,
    `${FORM_ID.TICKET_SUBJECT_SAVE}:${ticketId}`
  );
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

describe("the new-ticket page is the form now, and nothing else", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("binds one form row to the create verb, with no stub left beside it", () => {
    const page = newTicketPage();
    const props = formProps(page);

    expect(map(modules(page), "id")).toEqual(["form"]);
    expect(props.submit).toBe(MOCK_ACTION.TICKET_CREATE);
    expect(boundRefId(props, "schema")).toBe(
      DATA_REF_ID.NEW_TICKET_FORM_SCHEMA
    );
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.NEW_TICKET_FORM_UISCHEMA
    );
    expect(boundRefId(props, "model")).toBe(DATA_REF_ID.NEW_TICKET_FORM_MODEL);
    expect(props.submitLabel).toBeTruthy();
    expect(
      filter(stringsIn(page), value =>
        /coming soon|not yet|placeholder/i.test(value)
      )
    ).toEqual([]);
  });

  it("hands the module the schema module's own schema, uischema and blank", () => {
    const data = hostgrid();
    const context = ticketFormContext(data, {});

    expect(ref(data, DATA_REF_ID.NEW_TICKET_FORM_SCHEMA)).toEqual(
      ticketSchemas.useSchema(context)
    );
    expect(ref(data, DATA_REF_ID.NEW_TICKET_FORM_UISCHEMA)).toEqual(
      ticketSchemas.useUischema(context)
    );
    expect(ref(data, DATA_REF_ID.NEW_TICKET_FORM_MODEL)).toEqual(
      ticketSchemas.newTicketDefaults(context)
    );
  });
});

describe("what the form asks follows the brand's own desks and this client's products", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("offers the desks a brand publishes more than one of, and insists on one", () => {
    const data = hostgrid();

    expect(data.departments.length).toBeGreaterThan(1);
    expect(get(schemaFor(data), "properties.departmentId.enum")).toEqual(
      map(data.departments, "id")
    );
    expect(get(schemaFor(data), "properties.departmentId.options")).toEqual(
      map(data.departments, department => ({
        label: department.name,
        value: department.id
      }))
    );
    expect(get(schemaFor(data), "required")).toContain("departmentId");
    expect(controlAt(data, "#/properties/departmentId")).toBeDefined();
  });

  it("asks nobody to choose the one desk a brand publishes", () => {
    const one = minimal();

    expect(one.departments).toHaveLength(1);
    expect(get(schemaFor(one), "properties.departmentId")).toBeUndefined();
    expect(get(schemaFor(one), "required")).not.toContain("departmentId");
    expect(controlAt(one, "#/properties/departmentId")).toBeUndefined();
  });

  it("offers this client's own products, and no product at all", () => {
    const data = hostgrid();

    expect(get(schemaFor(data), "properties.productId.enum")).toEqual([
      null,
      ...map(data.products, "id")
    ]);
    expect(get(schemaFor(data), "properties.productId.options")).toEqual(
      map(data.products, product => ({
        label: product.name,
        value: product.id
      }))
    );
  });

  it("opens on the product the assistance link named, and on none without one", () => {
    const data = hostgrid();
    const product = data.products[0];

    expect(
      get(ref(data, DATA_REF_ID.NEW_TICKET_FORM_MODEL), "productId")
    ).toBeNull();
    expect(
      get(
        ref(data, DATA_REF_ID.NEW_TICKET_FORM_MODEL, {
          productId: product?.id
        }),
        "productId"
      )
    ).toBe(product?.id);
  });

  it("refuses a thread with nothing said and nothing asked", () => {
    const data = hostgrid();
    const validate = usePortalAjv().compile(schemaFor(data));
    const department = data.departments[0]?.id;
    const whole = { subject: SUBJECT, body: BODY, departmentId: department };

    expect(validate(whole)).toBe(true);
    expect(validate({ body: BODY, departmentId: department })).toBe(false);
    expect(validate({ subject: SUBJECT, departmentId: department })).toBe(
      false
    );
    expect(
      validate({ subject: "", body: BODY, departmentId: department })
    ).toBe(false);
    expect(validate({ subject: SUBJECT, body: BODY })).toBe(false);
  });
});

describe("opening a thread", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("numbers it one past the highest, opens it, and says the client said it", () => {
    const data = hostgrid();
    const before = data.tickets.length;
    const next = highestReference(data) + 1;
    const department = data.departments[0];
    const product = data.products[0];

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.TICKET_CREATE}:${JSON.stringify({
        subject: SUBJECT,
        departmentId: department?.id,
        productId: product?.id,
        body: BODY,
        attachments: ATTACHMENTS
      })}`
    );

    const created = find(data.tickets, { subject: SUBJECT });
    expect(data.tickets.length).toBe(before + 1);
    expect(created?.reference).toBe(`#${next}`);
    expect(created?.status).toBe(TicketStatusCodes.OPEN);
    expect(created?.department).toBe(department?.name);
    expect(created?.productId).toBe(product?.id);
    expect(created?.messages).toHaveLength(1);
    expect(created?.messages[0]?.author).toBe(data.persona.name);
    expect(created?.messages[0]?.authorType).toBe("client");
    expect(created?.messages[0]?.body).toBe(BODY);
    expect(created?.messages[0]?.attachments).toEqual(ATTACHMENT_NAMES);

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain(`#${next}`);
    expect(result?.to).toBe(`/support/tickets/${created?.id ?? ""}`);
  });

  it("records no attachment where the client named no file", () => {
    const data = hostgrid();

    dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.TICKET_CREATE}:${JSON.stringify({
        subject: SUBJECT,
        departmentId: data.departments[0]?.id,
        body: BODY,
        attachments: ""
      })}`
    );

    const created = find(data.tickets, { subject: SUBJECT });
    expect(created?.messages[0]?.attachments ?? []).toEqual([]);
  });
});

describe("renaming a thread", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("is offered on every open, unlocked thread and on no other", () => {
    const data = hostgrid();

    for (const ticket of data.tickets) {
      const renameable =
        ticket.status !== TicketStatusCodes.CLOSED && ticket.locked !== true;

      expect(manageValues(data, ticket.id)).toEqual(
        renameable
          ? expect.arrayContaining([renameValue(ticket.id)])
          : expect.not.arrayContaining([renameValue(ticket.id)])
      );
    }
  });

  it("opens on the subject on file and writes the new one back", () => {
    const data = hostgrid();
    const ticket = ticketBy(
      data,
      "open, unlocked thread",
      candidate =>
        candidate.status !== TicketStatusCodes.CLOSED &&
        candidate.locked !== true
    );
    const messages = ticket.messages.length;

    const opened = dispatchMockAction(data, NO_CONTEXT, renameValue(ticket.id));
    expect(opened?.form).toEqual({
      id: FORM_ID.TICKET_SUBJECT_SAVE,
      entityId: ticket.id
    });

    const entry = resolveMockForm(data, FORM_ID.TICKET_SUBJECT_SAVE, ticket.id);
    expect(entry?.model).toEqual(ticketSchemas.subjectDefaults(ticket.subject));
    expect(entry?.schema).toEqual(ticketSchemas.useSubjectSchema());
    expect(entry?.submit).toBe(
      `${MOCK_ACTION.TICKET_SUBJECT_SAVE}:${ticket.id}`
    );

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.TICKET_SUBJECT_SAVE}:${ticket.id}:${JSON.stringify({
        subject: RENAMED
      })}`
    );

    const saved = find(data.tickets, { id: ticket.id });
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(saved?.subject).toBe(RENAMED);
    expect(saved?.status).toBe(ticket.status);
    expect(saved?.messages).toHaveLength(messages);
    expect(
      map(reject(data.tickets, { id: ticket.id }), "subject")
    ).not.toContain(RENAMED);
  });
});
