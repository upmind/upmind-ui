// -----------------------------------------------------------------------------
/**
 * @fileoverview tickets — the attachment upload entry point itself (AC-23)
 *
 * ## Job To Be Done
 * `tickets.manager.int.test.ts`'s AC-23 coverage builds a `TicketAttachmentRef`
 * off the recorded fixture and hands it straight to `reply()` — it never calls
 * `uploadAttachment` (see this module's `.feature`, "ONE HOLE REMAINS INSIDE
 * AC-23"). This file closes that hole: it drives `uploadAttachment` through
 * the PUBLIC surface, on both the manager arm (attaching to a reply) and the
 * collection arm (attaching to a new ticket, per the Gherkin's "a new ticket
 * or a reply"), and proves both rejection guards named in the parity table
 * (the size ceiling and the brand's allowed-file-type list) refuse before any
 * request is issued.
 *
 * ## What Breaks If These Fail
 * A client's upload silently sends nothing to the server (a green suite
 * proving only that the FIXTURE has the right shape, never that the caller's
 * own composable action does), or an oversized/disallowed file reaches the
 * network instead of being refused client-side.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientTicket, useClientTickets } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  TICKET_ATTACHMENT_MAX_BYTES,
  TicketContextTypes
} from "../tickets.types";
import { server } from "./setup.integration";
import {
  RECORDED_TICKET_ID,
  installTicketsHandlers,
  recorded,
  seedClientSession
} from "./tickets.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

function manager(id: string = RECORDED_TICKET_ID) {
  return useClientTicket()
    .as(ScopeActorTypes.CLIENT)
    .for(TicketContextTypes.TICKET, id);
}

function observeUploadRequests(): {
  all: () => { method: string; url: string }[];
  stop: () => void;
} {
  const seen: { method: string; url: string }[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/ticket_messages/files")) return;
    if (request.url.includes("/download")) return;
    seen.push({ method: request.method, url: request.url });
  };
  server?.events.on("request:start", listener);
  return {
    all: () => seen,
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

function installUploadHandler(): {
  capturedForm: () => FormData | undefined;
} {
  let capturedForm: FormData | undefined;
  server?.use(
    http.post("*/api/ticket_messages/files", async ({ request }) => {
      capturedForm = await request.formData();
      return HttpResponse.json(recorded.uploadedFile());
    })
  );
  return { capturedForm: () => capturedForm };
}

// -----------------------------------------------------------------------------

describe("tickets manager — uploading an attachment for a reply (AC-23)", () => {
  it("uploadAttachment() issues a real multipart POST (file + brand_id) and resolves the recorded attachment ref", async () => {
    await seedClientSession();
    installTicketsHandlers();
    const upload = installUploadHandler();
    const observed = observeUploadRequests();

    const ticket = manager();
    await vi.waitFor(() =>
      expect(!!ticket.useContext().data.value?.id).toBe(true)
    );

    const file = new File(
      ["FE-3226 fixture capture attachment.\n"],
      "fe-3226-fixture-attachment.txt",
      { type: "text/plain" }
    );

    const ref = await ticket.useActions().uploadAttachment(file);
    observed.stop();

    expect(observed.all().some(request => request.method === "POST")).toBe(
      true
    );
    const form = upload.capturedForm();
    expect(form?.get("file")).toBeInstanceOf(File);
    expect((form?.get("file") as File).name).toBe(file.name);
    expect(typeof form?.get("brand_id")).toBe("string");
    expect(form?.get("brand_id")).toBeTruthy();

    const recordedRow = (
      recorded.uploadedFile() as {
        data: Array<{
          id: string;
          type: string;
          mime_type: string;
          object_type: string;
          object_class: string;
          object_id: string | null;
          name: string;
        }>;
      }
    ).data[0]!;
    expect(ref).toMatchObject({
      id: recordedRow.id,
      type: recordedRow.type,
      mime_type: recordedRow.mime_type,
      object_type: recordedRow.object_type,
      object_class: recordedRow.object_class,
      object_id: recordedRow.object_id,
      name: recordedRow.name
    });
  });
});

describe("tickets collection — uploading an attachment for a new ticket (AC-23)", () => {
  it("uploadAttachment() issues a real multipart POST before any ticket exists, and resolves the recorded attachment ref", async () => {
    await seedClientSession();
    installTicketsHandlers();
    const upload = installUploadHandler();
    const observed = observeUploadRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const file = new File(
      ["FE-3226 fixture capture attachment.\n"],
      "fe-3226-fixture-attachment.txt",
      { type: "text/plain" }
    );

    const ref = await tickets.useActions().uploadAttachment(file);
    observed.stop();

    expect(observed.all().some(request => request.method === "POST")).toBe(
      true
    );
    const form = upload.capturedForm();
    expect(form?.get("file")).toBeInstanceOf(File);
    expect(typeof form?.get("brand_id")).toBe("string");
    expect(form?.get("brand_id")).toBeTruthy();

    const recordedRow = (
      recorded.uploadedFile() as { data: Array<{ id: string }> }
    ).data[0]!;
    expect(ref).toMatchObject({ id: recordedRow.id });
  });
});

describe("tickets manager — an oversized or disallowed attachment is refused before any request (AC-23 guard)", () => {
  it("refuses a file larger than the permitted size, with NO request sent", async () => {
    await seedClientSession();
    installTicketsHandlers();
    installUploadHandler();

    const ticket = manager();
    await vi.waitFor(() =>
      expect(!!ticket.useContext().data.value?.id).toBe(true)
    );

    const oversized = new File(
      [new Uint8Array(TICKET_ATTACHMENT_MAX_BYTES + 1)],
      "too-big.bin",
      { type: "application/octet-stream" }
    );

    const observed = observeUploadRequests();
    await expect(
      ticket.useActions().uploadAttachment(oversized)
    ).rejects.toThrow();
    observed.stop();

    expect(observed.all()).toEqual([]);
  });

  it("refuses a file of a kind the brand does not allow, with NO request sent", async () => {
    await seedClientSession();
    installTicketsHandlers();
    installUploadHandler();

    const ticket = manager();
    await vi.waitFor(() =>
      expect(!!ticket.useContext().data.value?.id).toBe(true)
    );

    // An executable is refused by every brand's allowed-upload-type list a
    // support-ticket attachment guard could plausibly configure — chosen to
    // exercise the guard without depending on one brand's exact list content.
    const disallowed = new File(["MZ"], "invoice.exe", {
      type: "application/x-msdownload"
    });

    const observed = observeUploadRequests();
    await expect(
      ticket.useActions().uploadAttachment(disallowed)
    ).rejects.toThrow();
    observed.stop();

    expect(observed.all()).toEqual([]);
  });
});
