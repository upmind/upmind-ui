// -----------------------------------------------------------------------------
/**
 * @fileoverview Session-Store Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `session-store` module's boot flow hits and
 * (re)generate their sanitised v3 fixtures into this module's OWN co-located
 * `fixtures/` dir — the same files the session-store integration tests replay
 * through MSW. Run on demand:
 *
 *   pnpm fixtures:generate session-store
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * ## Ownership notes (ADR 025)
 * The boot flow's guest mint hits `/oauth/access_token` — the same endpoint
 * the auth module owns fixtures for. Replay loads ONLY a unit's own co-located
 * dir, so cross-module reuse is structurally impossible: this unit records its
 * OWN guest-grant copy. Duplication across units is intended.
 *
 * `GET admin/self` (staff variant) is captured only when the staff credentials
 * in tests/fixtures/credentials.ts are valid on the recording brand; otherwise
 * it is skipped and reported as an omission.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes, PaymentType } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintGuestToken,
  mintStaffToken,
  mintToken
} from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          "in .env.recording). The API resolves the brand from the Origin " +
          'header; without it every call returns 404 "Domain not found!".'
      );
    })();

// Mirrors session-store.services.ts loadClientUser / loadStaffUser exactly so
// the recorded envelope matches what the real service receives.
const SELF_QUERY =
  "with_count=actor.child_client_configs&with=" +
  [
    "actor",
    "actor.account",
    "actor.brand",
    "actor.image",
    "actor.parent_client_config.parent_client",
    "actor.parent_client_config.parent_client.image",
    "accounts",
    "delegated_ids",
    "enabled_modules"
  ].join();

const ADMIN_SELF_QUERY =
  "with=" +
  [
    "actor",
    "actor.image",
    "brands",
    "brands.image",
    "brands.icon",
    "functionalities",
    "user_flow_secrets",
    "upmind_contract_product"
  ].join();

// -----------------------------------------------------------------------------

/** A control call OUTSIDE the capture pipeline — it moves staging state (grant scope arrange/restore) and is never recorded. */
async function control(
  method: string,
  path: string,
  token?: string,
  body?: unknown
): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return response.json().catch(() => null);
}

// -----------------------------------------------------------------------------

describe("Session-Store API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let staffToken: IToken | undefined;
  let guestToken: IToken | undefined;
  let memberToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "session-store"
    });

    clientToken = await mintClientToken();

    guestToken = await mintGuestToken();
    if (!guestToken?.refresh_token) {
      console.warn(
        "[session-store.fixtures] OMISSION: could not mint a guest token with " +
          "a refresh_token; POST /oauth/access_token refresh grant (guest) " +
          "not captured."
      );
    }

    staffToken = await mintStaffToken().catch(() => undefined);
    if (!staffToken) {
      console.warn(
        "[session-store.fixtures] OMISSION: staff credentials rejected on " +
          "the recording brand; GET admin/self (200) not captured."
      );
    }

    // The delegate MEMBER holds a standing account-level grant from the delegate
    // owner (tests/fixtures/credentials.ts, FE-3036), so its `/self` is the only
    // account on staging whose `delegated_ids` is populated. Recorded here so
    // this module's OWN co-located fixtures carry the populated map its delegate
    // scenarios replay (ADR 025 co-location — no cross-module reuse).
    memberToken = await mintToken({
      grant_type: "password",
      username: API_CREDENTIALS.delegateMember.username,
      password: API_CREDENTIALS.delegateMember.password
    }).catch(() => undefined);
    if (!memberToken) {
      console.warn(
        "[session-store.fixtures] OMISSION: delegate-member credentials " +
          "rejected; the populated delegated_ids /self was not captured."
      );
    }
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/self (200, client)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/self?${SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures GET /api/self with an invalid bearer (401)", async () => {
    generator.setBearerToken("fixturegen-invalid-token");
    await generator.get(`/api/self?case=invalid-token&${SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures POST /oauth/access_token guest grant (200) — boot-flow mint", async () => {
    const { status } = await generator.post(
      "/oauth/access_token",
      { grant_type: GrantTypes.GUEST },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] guest mint returned ${status}, not 200`
      );
    }
  });

  it("captures POST /oauth/access_token refresh grant (200, guest) — mid-session guest refresh", async () => {
    // `?case=` keeps this out of the boot-flow guest fixture's identity: both
    // responses carry actor_type "guest", so without it the filename collides
    // and the re-record overwrites the boot mint (fixture-naming.mjs).
    if (!guestToken?.refresh_token) return;
    const { status } = await generator.post(
      "/oauth/access_token?case=refresh-guest",
      {
        grant_type: GrantTypes.REFRESH_TOKEN,
        refresh_token: guestToken.refresh_token
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] guest refresh returned ${status}, not 200`
      );
    }
  });

  it("captures POST /oauth/access_token with a rejected grant (4xx)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token?case=rejected-grant",
      {
        grant_type: GrantTypes.REFRESH_TOKEN,
        refresh_token: "fixturegen-invalid-refresh-token"
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status < 400) {
      console.warn(
        `[session-store.fixtures] rejected grant returned ${status}, ` +
          "expected 4xx — inspect the capture before committing."
      );
    }
  });

  it("captures POST /oauth/access_token password grant (200, client)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token",
      {
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.client.username,
        password: API_CREDENTIALS.client.password
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] client login mint returned ${status}, not 200`
      );
    }
  });

  it("captures POST /oauth/access_token admin grant (200, staff)", async () => {
    if (!staffToken?.access_token) return;
    const { status } = await generator.post(
      "/oauth/access_token",
      {
        grant_type: GrantTypes.ADMIN,
        username: API_CREDENTIALS.staff.username,
        password: API_CREDENTIALS.staff.password
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] staff login mint returned ${status}, not 200`
      );
    }
  });

  it("captures GET /api/admin/self (200, staff — only if creds valid)", async () => {
    if (!staffToken?.access_token) return;
    generator.setBearerToken(staffToken.access_token);
    await generator.get(`/api/admin/self?${ADMIN_SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures GET /api/admin/self with a client token (wrong actor, 4xx)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/admin/self?case=wrong-actor&${ADMIN_SELF_QUERY}`
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[session-store.fixtures] wrong-actor admin/self returned ${status}, ` +
          "expected 4xx — inspect the capture before committing."
      );
    }
  });

  // --- the delegate member: a POPULATED delegated_ids surface -----------------
  // The delegate member holds a standing account-level grant, so its `/self`
  // carries `delegated_ids.client = [ownerId]` — the populated map DG1/DG4/DG7's
  // TRUE path replays. The grant is account-level only, so the map holds the
  // `client` key ALONE; `contracts_product` and `ticket` need per-record grants
  // that ride FE-3041 (DG1-product / DG8-ticket stay blocked, see feature).

  it("captures GET /api/self for the delegate member (200, populated delegated_ids.client)", async () => {
    if (!memberToken?.access_token) return;
    generator.setBearerToken(memberToken.access_token);
    const { status, body } = await generator.get(
      `/api/self?case=delegated&${SELF_QUERY}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] member /self returned ${status}, not 200.`
      );
      return;
    }
    const delegatedIds = (
      body as { data?: { delegated_ids?: Record<string, string[]> } }
    ).data?.delegated_ids;
    if (!delegatedIds?.client?.length) {
      console.warn(
        "[session-store.fixtures] member /self carries no delegated_ids.client " +
          "— the standing grant may have been revoked; re-run delegates fixtures."
      );
    }
  });

  // --- delegated per-record surfaces (the invoice / contract-product rows the
  //     member reads by delegation), for isDelegated / getOwnerForDelegatedRecord.
  // Invoices embed the owning client (`delegate_related` + `client`); contract
  // products carry `is_delegated_object`. The no-owner variant omits `with=client`
  // so a row carries no owner, backing the getOwnerForDelegatedRecord empty case.

  it("captures GET /api/invoices for the delegate member with the owner embedded (200)", async () => {
    if (!memberToken?.access_token) return;
    generator.setBearerToken(memberToken.access_token);
    await generator.get(
      "/api/invoices?case=delegated&with=client,client.parent_client_config&order=-created_at&limit=25"
    );
    generator.clearBearerToken();
  });

  it("captures GET /api/invoices for the delegate member WITHOUT the owner embedded (200)", async () => {
    if (!memberToken?.access_token) return;
    generator.setBearerToken(memberToken.access_token);
    await generator.get(
      "/api/invoices?case=no-owner&order=-created_at&limit=5"
    );
    generator.clearBearerToken();
  });

  it("captures GET /api/contract_products for the delegate member with the owner embedded (200)", async () => {
    if (!memberToken?.access_token) return;
    generator.setBearerToken(memberToken.access_token);
    await generator.get(
      "/api/contract_products?case=delegated&with=client,client.parent_client_config&limit=25"
    );
    generator.clearBearerToken();
  });

  // --- DG1-product: a scoped (non-full) per-product grant surfaces the
  //     `contracts_product` key on the member's delegated_ids. The owner's grant
  //     is switched from full to product-scoped, the member /self recorded, then
  //     the full grant is RESTORED in the same step's `finally` so staging is
  //     left exactly as found (operator ruling 2026-09-24 — arrange, record, reset).

  it("captures GET /api/self for the delegate member under a product-scoped grant (200, contracts_product key)", async () => {
    if (!memberToken?.access_token) return;
    const ownerToken = await mintToken({
      grant_type: "password",
      username: API_CREDENTIALS.delegateOwner.username,
      password: API_CREDENTIALS.delegateOwner.password
    }).catch(() => undefined);
    if (!ownerToken?.access_token) {
      console.warn(
        "[session-store.fixtures] OMISSION: delegate-owner token rejected; " +
          "the product-scoped /self was not captured (DG1-product)."
      );
      return;
    }
    const ownerId = ownerToken.actor_id as string;
    const bearer = ownerToken.access_token;

    const delegates = (await control(
      "GET",
      `/api/clients/${ownerId}/delegates`,
      bearer
    )) as { data?: { id: string; invite_email: string }[] };
    const record = (delegates?.data ?? []).find(
      row => row.invite_email === API_CREDENTIALS.delegateMember.username
    );
    const products = (await control(
      "GET",
      `/api/contract_products?limit=1`,
      bearer
    )) as { data?: { id: string }[] };
    const cpId = products?.data?.[0]?.id;
    if (!record || !cpId) {
      console.warn(
        "[session-store.fixtures] OMISSION: no delegate record or no contract " +
          "product to scope; product-scoped /self not captured (DG1-product)."
      );
      return;
    }

    try {
      await control(
        "PUT",
        `/api/clients/${ownerId}/delegates/${record.id}`,
        bearer,
        { full_delegate: false, add_contract_product_ids: [cpId] }
      );
      generator.setBearerToken(memberToken.access_token);
      const { body } = await generator.get(
        `/api/self?case=delegated-product&${SELF_QUERY}`
      );
      generator.clearBearerToken();
      const keys = Object.keys(
        (body as { data?: { delegated_ids?: Record<string, string[]> } }).data
          ?.delegated_ids ?? {}
      );
      if (!keys.includes("contracts_product")) {
        console.warn(
          `[session-store.fixtures] product-scoped /self keys=${JSON.stringify(keys)} ` +
            "— no contracts_product key surfaced (DG1-product)."
        );
      }
    } finally {
      // Remove the per-product grant this arrange added before restoring the full
      // grant, so no `contracts_product` grant lingers on the record for DG8.
      await control(
        "PUT",
        `/api/clients/${ownerId}/delegates/${record.id}`,
        bearer,
        { full_delegate: true, remove_contract_product_ids: [cpId] }
      );
    }
  }, 60000);

  // --- DG8: a ticket-only grant surfaces the `ticket` key ALONE (no `client`,
  //     no `contracts_product`), so hasDelegatedProducts reads false. The member
  //     holds full grants from EVERY owner in its delegated_ids.client, so ALL of
  //     them are scoped to ticket-only (admin PUT, staff token) around the record
  //     and RESTORED to full in `finally`. Each owner needs a ticket of its own,
  //     created (admin) for the arrange and reused thereafter.

  it("captures GET /api/self for the delegate member under a ticket-only grant (200, ticket key alone)", async () => {
    if (!memberToken?.access_token) return;
    const staffToken = await mintStaffToken().catch(() => undefined);
    if (!staffToken?.access_token) {
      console.warn(
        "[session-store.fixtures] OMISSION: staff token rejected; ticket-only " +
          "/self not captured (DG8)."
      );
      return;
    }
    const staff = staffToken.access_token;
    const memberId = memberToken.actor_id as string;

    const selfBody = (await control(
      "GET",
      `/api/self?${SELF_QUERY}`,
      memberToken.access_token
    )) as { data?: { delegated_ids?: { client?: string[] } } };
    const ownerIds = selfBody?.data?.delegated_ids?.client ?? [];
    if (!ownerIds.length) {
      console.warn(
        "[session-store.fixtures] OMISSION: member holds no delegated owners; " +
          "ticket-only /self not captured (DG8)."
      );
      return;
    }

    // A ticket create needs a department. The create route is the admin
    // contextual POST /api/admin/tickets carrying the owner as `client_id`
    // (vue-app store/modules/data/tickets/index.ts `create` → apiPath().contextual).
    const departments = (await control(
      "GET",
      "/api/admin/tickets/departments?limit=1",
      staff
    )) as { data?: { id?: string }[] };
    const departmentId = departments?.data?.[0]?.id;

    const scoped: { ownerId: string; recordId: string }[] = [];
    try {
      for (const ownerId of ownerIds) {
        const dels = (await control(
          "GET",
          `/api/admin/clients/${ownerId}/delegates`,
          staff
        )) as {
          data?: {
            id: string;
            invite_email?: string;
            delegate_client_id?: string;
          }[];
        };
        const rec = (dels?.data ?? []).find(
          r =>
            r.delegate_client_id === memberId ||
            r.invite_email === API_CREDENTIALS.delegateMember.username
        );
        if (!rec) {
          console.warn(
            `[session-store.fixtures] DG8: no delegate record for the member on owner ${ownerId}.`
          );
          continue;
        }
        const ticket = (await control("POST", "/api/admin/tickets", staff, {
          client_id: ownerId,
          subject: "FE-3145 delegated-access fixture ticket",
          body: "Arranged to record a ticket-only delegated grant.",
          ...(departmentId ? { ticket_department_id: departmentId } : {})
        })) as { data?: { id?: string }; error?: { message?: string } };
        const ticketId = ticket?.data?.id;
        if (!ticketId) {
          console.warn(
            `[session-store.fixtures] DG8: ticket create for owner ${ownerId} returned no id ` +
              `(${JSON.stringify(ticket?.error ?? ticket)?.slice(0, 200)}).`
          );
          continue;
        }
        await control(
          "PUT",
          `/api/admin/clients/${ownerId}/delegates/${rec.id}`,
          staff,
          { full_delegate: false, add_ticket_ids: [ticketId] }
        );
        // With the full grant off, only the explicit per-product grants remain
        // (the DG1-product arrange leaves one on the record); remove them so
        // `ticket` is the ONLY key on the member's delegated_ids.
        // `limit=0` returns EVERY granted contract product in one page — owner
        // 25d96e76 has more than fit a default page, so an unpaginated read left
        // the rest behind and the `contracts_product` key persisted.
        const grantedCps = (await control(
          "GET",
          `/api/admin/clients/${ownerId}/delegates/${rec.id}/contract_products?limit=0`,
          staff
        )) as { data?: { id: string }[] };
        const cpIds = (grantedCps?.data ?? []).map(row => row.id);
        console.log(
          `[session-store.fixtures] DG8 owner ${ownerId}: granted CPs before remove=${cpIds.length}`
        );
        if (cpIds.length) {
          const removed = await control(
            "PUT",
            `/api/admin/clients/${ownerId}/delegates/${rec.id}`,
            staff,
            { full_delegate: false, remove_contract_product_ids: cpIds }
          );
          const afterCps = (await control(
            "GET",
            `/api/admin/clients/${ownerId}/delegates/${rec.id}/contract_products?limit=0`,
            staff
          )) as { data?: { id: string }[] };
          console.log(
            `[session-store.fixtures] DG8 owner ${ownerId}: remove status=${removed.status} ` +
              `granted CPs after remove=${(afterCps?.data ?? []).length}`
          );
        }
        scoped.push({ ownerId, recordId: rec.id });
      }

      if (scoped.length !== ownerIds.length) {
        console.warn(
          `[session-store.fixtures] DG8: scoped ${scoped.length}/${ownerIds.length} owners ` +
            "to ticket-only — the `client` key may persist; ticket-only /self not reliable."
        );
      }

      generator.setBearerToken(memberToken.access_token);
      const { body } = await generator.get(
        `/api/self?case=delegated-ticket-only&${SELF_QUERY}`
      );
      generator.clearBearerToken();
      const keys = Object.keys(
        (body as { data?: { delegated_ids?: Record<string, string[]> } }).data
          ?.delegated_ids ?? {}
      );
      console.log(
        `[session-store.fixtures] DG8 ticket-only /self keys=${JSON.stringify(keys)}`
      );
    } finally {
      for (const s of scoped) {
        await control(
          "PUT",
          `/api/admin/clients/${s.ownerId}/delegates/${s.recordId}`,
          staff,
          { full_delegate: true }
        );
      }
    }
  }, 120000);

  // --- DG2 child-account arms: a record whose OWNING CLIENT is a child account.
  //     `isDelegated` excludes such an invoice (the child-first gate — any parent
  //     on the client makes it hierarchy, not delegation) but KEEPS such a
  //     contract product. Staging holds none, so a child client is created (admin)
  //     under the delegate OWNER, given an invoice + contract product through its
  //     OWN order→convert flow, and read back by the OWNER (the parent) — whose
  //     co-mingled invoices/contract_products list carries its own rows PLUS the
  //     child's, the child's embedding `client.parent_client_config` (its
  //     parent_client_id === the reading owner). Non-fatal throughout: a failed
  //     arrange logs and skips so the rest of the generator still records.

  it("captures the owner's co-mingled child-account invoice + contract product (200)", async () => {
    const staffToken = await mintStaffToken().catch(() => undefined);
    const ownerToken = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.delegateOwner.username,
      password: API_CREDENTIALS.delegateOwner.password
    }).catch(() => undefined);
    if (!staffToken?.access_token || !ownerToken?.access_token) {
      console.warn(
        "[session-store.fixtures] OMISSION: staff/owner token rejected; " +
          "child-account records not captured (DG2 units)."
      );
      return;
    }
    const staff = staffToken.access_token;
    const ownerId = ownerToken.actor_id as string;

    const settings = (await control(
      "GET",
      "/api/brand/settings",
      ownerToken.access_token
    )) as { data?: { id?: string } };
    const brandId = settings?.data?.id;
    if (!brandId) {
      console.warn(
        "[session-store.fixtures] OMISSION: no brand id from /api/brand/settings; " +
          "child-account records not captured (DG2 units)."
      );
      return;
    }

    const stamp = Date.now();
    const childEmail = `nathan.robinson+fe3145child${stamp}@upmind.com`;
    const childPassword = "Password1";

    // The client-create 404s "Currency not found!" with a null currency, so a real
    // brand currency is resolved first (the owner's own — it shares the brand).
    const currencies = (await control(
      "GET",
      "/api/currencies?limit=1",
      ownerToken.access_token
    )) as { data?: { id?: string }[] };
    const currencyId = currencies?.data?.[0]?.id;

    // Create a child client. The body follows the admin client-create shape; if a
    // required field is missing on this brand the API 422s and this step skips
    // (disclosed), leaving the DG2 unit scenarios @todo rather than mis-recording.
    const created = (await control("POST", "/api/admin/clients", staff, {
      brand_id: brandId,
      firstname: "FE3145",
      lastname: "Child",
      username: childEmail,
      email: childEmail,
      password: childPassword,
      language: "en",
      ...(currencyId ? { currency_id: currencyId } : {})
    })) as { data?: { id?: string }; error?: { message?: string } };
    const childId = created?.data?.id;
    if (!childId) {
      console.warn(
        "[session-store.fixtures] DG2 units: child client create returned no id " +
          `(${JSON.stringify(created?.error ?? created)?.slice(0, 300)}). ` +
          "Scenarios stay @todo; report the required client-create body."
      );
      return;
    }

    try {
      await control(
        "POST",
        `/api/admin/clients/${ownerId}/child_configs`,
        staff,
        {
          child_client_id: childId,
          allow_impersonation: true,
          inherit_payment_details: true
        }
      );

      // Give the child its own invoice + contract product through the ADMIN order
      // flow — a freshly created child cannot log in to self-order (the child-token
      // mint fails), so the order is placed as STAFF for the child, then converted
      // pay-later (invoices.fixtures.ts AC-13 shape).
      const order = (await control("POST", "/api/admin/orders", staff, {
        client_id: childId,
        brand_id: brandId,
        ...(currencyId ? { currency_id: currencyId } : {}),
        category_slug: "new_contract",
        products: [
          {
            product_id: "3de78642-de53-9714-76df-21208469530d",
            quantity: 1,
            billing_cycle_months: 1
          }
        ]
      })) as { status?: number; data?: { id?: string }; error?: unknown };
      const basketId = order?.data?.id;
      const convert = basketId
        ? await control(
            "PATCH",
            `/api/admin/orders/${basketId}/convert`,
            staff,
            { type: PaymentType.PAY_LATER, amount: 0 }
          )
        : undefined;
      console.log(
        `[session-store.fixtures] DG2 child ${childId}: admin order status=${order.status} ` +
          `basket=${basketId ?? "none"} order.error=${JSON.stringify(order.error)?.slice(0, 300)} ` +
          `convert status=${convert?.status ?? "skipped"} convert.error=${JSON.stringify((convert?.body as { error?: unknown })?.error)?.slice(0, 200)}`
      );

      // Verify the child's parent points at the OWNER whose list we record — a
      // mismatch means the co-mingled read would never surface the child.
      const childRecord = (await control(
        "GET",
        `/api/admin/clients/${childId}?with=parent_client_config`,
        staff
      )) as {
        data?: { parent_client_config?: { parent_client_id?: string } };
      };
      console.log(
        `[session-store.fixtures] DG2 child ${childId}: parent_client_id=${childRecord?.data?.parent_client_config?.parent_client_id} ownerId=${ownerId}`
      );

      const childInvoices = (await control(
        "GET",
        `/api/invoices?client_id=${childId}&limit=5`,
        staff
      )) as { data?: unknown[] };
      const childCps = (await control(
        "GET",
        `/api/contract_products?client_id=${childId}&limit=5`,
        staff
      )) as { data?: unknown[] };
      console.log(
        `[session-store.fixtures] DG2 child ${childId}: own invoices=${childInvoices?.data?.length ?? 0} own CPs=${childCps?.data?.length ?? 0}`
      );

      // The OWNER (the parent) reads its own co-mingled subtree; the child's rows
      // embed `client.parent_client_config` pointing back to this owner.
      generator.setBearerToken(ownerToken.access_token);
      const ownerInvoices = await generator.get(
        "/api/invoices?case=child-account&with=client,client.parent_client_config&order=-created_at&limit=100"
      );
      await generator.get(
        "/api/contract_products?case=child-account&with=client,client.parent_client_config&limit=100"
      );
      generator.clearBearerToken();
      const ownerRows =
        (
          ownerInvoices?.body as {
            data?: {
              client?: { id?: string; parent_client_config?: unknown };
            }[];
          }
        )?.data ?? [];
      console.log(
        `[session-store.fixtures] DG2 owner co-mingled invoices=${ownerRows.length} ` +
          `withParentConfig=${ownerRows.filter(r => r.client?.parent_client_config).length} ` +
          `childRows=${ownerRows.filter(r => r.client?.id === childId).length}`
      );
    } finally {
      // Deactivate the arranged child so it does not linger as active staging data.
      await control("DELETE", `/api/admin/clients/${childId}`, staff);
    }
  }, 120000);
});
