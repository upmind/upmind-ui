// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices single read — download the invoice/credit-note PDF
 * (AC-17, FE-3031's mid-run addition)
 *
 * ## Job To Be Done
 * Prove `useInvoice().withId(id).useActions().downloadPdf()` issues a real
 * `GET api/invoices/{id}/download` for the invoice actually held, that the
 * response is handled as a Blob — never treated as JSON, which a shape
 * assertion cannot see — that the file handed to the save utility is named
 * `${invoice.number}.pdf`, that a credit note (an invoice with a different
 * `category`) rides the SAME reader with no branch, and that the request is
 * scoped through this module's ONE `resolveClientId`/`isAddressable` seam
 * (`invoices.types.ts`'s `InvoicesServices.isAddressable` docblock: "the ONE
 * addressability predicate every request gate in `invoices.services.ts`
 * calls") — the same standard every other read in this module is held to
 * (`invoices.scope-identity.int.test.ts`; `invoices.collection.int.test.ts`
 * AC-14).
 *
 * ## Provenance
 * The invoice row is `recorded.unpaid()` — a REAL captured row (`number`:
 * the real recorded value, confirmed present on the wire fixture by
 * inspection). The credit-note row is `recorded.unpaid()` with ONLY
 * `category.slug` toggled to `credit_note` (CONSTRUCTED — the accepted
 * precedent already used in this module for exactly this gap:
 * `invoices.mapping.int.test.ts`, `invoices.attribution.int.test.ts` —
 * `invoices.fixtures.ts`'s own disclosure log confirms this staging
 * account's real history carries no credit note).
 *
 * The `/invoices/{id}/download` response body is a SYNTHETIC binary payload
 * (`Content-Type: application/pdf`) — a control response exempt from the
 * recorded-journey-body rule, the same precedent this module's own
 * `invoices.payment-method.int.test.ts` already uses for its PATCH ack: the
 * assertions here are on the OUTBOUND REQUEST and on how the response is
 * HANDLED (Blob vs JSON, the save filename), never on the PDF's byte
 * content — no capture is needed to prove either. `invoices.fixtures.ts` has
 * no binary/blob capture support (confirmed by inspection, not assumed). The
 * file-save side effect (`downloadBlob`, `invoices.utils.ts`) is a browser
 * DOM mechanism (object URL + anchor) untestable in this environment; it is
 * mocked at the module boundary so the assertion lands on WHAT is handed to
 * it (a real `Blob`, the exact filename) rather than its own DOM mechanics.
 *
 * ## What Breaks If These Fail
 * A client cannot download their invoice or credit-note PDF, downloads the
 * wrong document, receives a corrupted (JSON-parsed) file, or a per-record
 * download route bypasses this module's identity seam — the FE-2824 failure
 * class in a new place.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useInvoice } from "..";
import {
  assertClientIdentityTransport,
  bootUnauthenticated,
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import { server } from "./setup.integration";
import "./setup.integration";
import type { WireInvoice } from "./invoices.int-helpers";

// -----------------------------------------------------------------------------

const { downloadBlobMock } = vi.hoisted(() => ({ downloadBlobMock: vi.fn() }));

vi.mock("../invoices.utils", async importOriginal => {
  const actual = await importOriginal<typeof import("../invoices.utils")>();
  return { ...actual, downloadBlob: downloadBlobMock };
});

type WireInvoiceWithNumber = WireInvoice & { number: string };

function envelope(data: WireInvoiceWithNumber) {
  return {
    status: "ok",
    data,
    total: null,
    error: null,
    messages: null,
    meta: null
  };
}

/** A synthetic binary body — see the file header's provenance disclosure. */
const PDF_BYTES = new TextEncoder().encode("%PDF-1.4 fixture-bytes-only");

function installDownloadHandler(): void {
  server.use(
    http.get(
      "*/invoices/:id/download",
      () =>
        new HttpResponse(PDF_BYTES, {
          headers: { "Content-Type": "application/pdf" }
        })
    )
  );
}

describe("invoices single read — download the invoice PDF (AC-17)", () => {
  it("AC-17 issues GET api/invoices/{id}/download for the held invoice, handles the response as a Blob (not JSON), and saves it as ${number}.pdf", async () => {
    const { accessToken } = await seedClientSession();
    const handlers = installInvoiceHandlers();
    installDownloadHandler();
    const row = recorded.unpaid() as WireInvoiceWithNumber;
    handlers.setOneBody(envelope(row));
    downloadBlobMock.mockClear();

    const single = useInvoice().withId(row.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    await single.useActions().downloadPdf();
    await vi.waitFor(() => expect(downloadBlobMock).toHaveBeenCalled());
    observed.stop();

    const request = observed
      .all()
      .find(entry => entry.url.includes("/download"));
    expect(request).toBeDefined();
    expect(request!.method).toBe("GET");
    expect(new URL(request!.url).pathname).toBe(
      `/api/invoices/${row.id}/download`
    );
    assertClientIdentityTransport(request!, accessToken);

    expect(downloadBlobMock).toHaveBeenCalledTimes(1);
    const [blobArg, filenameArg] = downloadBlobMock.mock.calls[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(filenameArg).toBe(`${row.number}.pdf`);
  });

  it("AC-17 (constructed — category.slug toggled) a credit note rides the SAME reader as a plain invoice: identical request shape, no category branch", async () => {
    const { accessToken } = await seedClientSession();
    const handlers = installInvoiceHandlers();
    installDownloadHandler();
    const plainInvoice = recorded.unpaid() as WireInvoiceWithNumber;
    const creditNote: WireInvoiceWithNumber = {
      ...plainInvoice,
      id: "download-row-002",
      category: { ...plainInvoice.category, slug: "credit_note" }
    };

    // Drive the plain invoice first — one download, one observed request.
    handlers.setOneBody(envelope(plainInvoice));
    downloadBlobMock.mockClear();
    const plainSingle = useInvoice().withId(plainInvoice.id);
    await vi.waitFor(() =>
      expect(plainSingle.useMeta().isLoading.value).toBe(false)
    );
    const observedPlain = observeInvoiceRequests();
    await plainSingle.useActions().downloadPdf();
    await vi.waitFor(() => expect(downloadBlobMock).toHaveBeenCalled());
    observedPlain.stop();
    const plainRequest = observedPlain
      .all()
      .find(entry => entry.url.includes("/download"));
    expect(plainRequest).toBeDefined();

    // Drive the credit note through the SAME reader.
    handlers.setOneBody(envelope(creditNote));
    downloadBlobMock.mockClear();
    const creditSingle = useInvoice().withId(creditNote.id);
    await vi.waitFor(() =>
      expect(creditSingle.useMeta().isLoading.value).toBe(false)
    );
    const observedCredit = observeInvoiceRequests();
    await creditSingle.useActions().downloadPdf();
    await vi.waitFor(() => expect(downloadBlobMock).toHaveBeenCalled());
    observedCredit.stop();
    const creditRequest = observedCredit
      .all()
      .find(entry => entry.url.includes("/download"));
    expect(creditRequest).toBeDefined();

    // Same URL SHAPE, parameterised only by id — no category/credit-note-
    // specific path segment or query param appears for the credit note.
    expect(new URL(creditRequest!.url).pathname).toBe(
      `/api/invoices/${creditNote.id}/download`
    );
    expect([...new URL(creditRequest!.url).searchParams.keys()].sort()).toEqual(
      [...new URL(plainRequest!.url).searchParams.keys()].sort()
    );
    assertClientIdentityTransport(creditRequest!, accessToken);

    expect(downloadBlobMock).toHaveBeenCalledTimes(1);
    const [blobArg, filenameArg] = downloadBlobMock.mock.calls[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(filenameArg).toBe(`${creditNote.number}.pdf`);
  });
});

describe("invoices single read — download refuses when no client is addressable (AC-17, the isAddressable gate)", () => {
  it("AC-17 issues NO download request and never calls the save utility when signed out", async () => {
    await bootUnauthenticated();
    installDownloadHandler();
    downloadBlobMock.mockClear();

    const single = useInvoice().withId("unaddressable-download-target");
    const observed = observeInvoiceRequests();
    await single
      .useActions()
      .downloadPdf()
      .catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, 500));
    observed.stop();

    expect(
      observed.all().filter(entry => entry.url.includes("/download"))
    ).toHaveLength(0);
    expect(downloadBlobMock).not.toHaveBeenCalled();
  });
});
