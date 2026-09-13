/**
 * @fileoverview Delegated-record predicate + owner-resolution (unit)
 *
 * ## Job To Be Done
 * Prove `isDelegated` reproduces the oracle's per-object-type branch table —
 * including the invoice/order child-account exclusion applied on exactly one
 * of the three record arms — and that `getOwnerForDelegatedRecord` resolves
 * the owner from the record's own embedded client, or `undefined` when none
 * is attached.
 *
 * ## What Breaks If These Fail
 * A child's own invoice is mislabelled as delegated (privacy leak reads the
 * wrong way); or the child-account exclusion is applied uniformly across all
 * three record types, silently hiding a genuinely delegated contract product
 * or ticket from a client who should see it — the parity-faithfulness defect
 * design.md names explicitly.
 */

import { describe, it, expect } from "vitest";
import { UpmindObjectTypes } from "@upmind-automation/types";
import { isDelegated, getOwnerForDelegatedRecord, mapSessionUser } from "..";
import type {
  DelegatableRecord,
  DelegatedRecordOwner
} from "../session-store.types";

// -----------------------------------------------------------------------------

function invoice(overrides: Record<string, unknown>): DelegatableRecord {
  return {
    object_type: UpmindObjectTypes.CLIENT,
    ...overrides
  } as unknown as DelegatableRecord;
}

function contractProduct(
  overrides: Record<string, unknown>
): DelegatableRecord {
  return {
    object_type: UpmindObjectTypes.CONTRACTS_PRODUCT,
    ...overrides
  } as unknown as DelegatableRecord;
}

function ticket(overrides: Record<string, unknown>): DelegatableRecord {
  return {
    object_type: UpmindObjectTypes.TICKET,
    ...overrides
  } as unknown as DelegatableRecord;
}

// -----------------------------------------------------------------------------

/**
 * A minimal `/self` envelope. Only the fields `mapSessionUser` reads are
 * populated; the cast carries the rest. This is a pure mapping over a typed
 * object, NOT a wire contract — no recorded fixture is implied or needed.
 */
function selfWith(delegatedIds: unknown): Parameters<typeof mapSessionUser>[0] {
  return {
    actor: {
      id: "client-1",
      email: "client@example.com",
      username: "client",
      interface_language_id: "en",
      interface_language_code: "en-GB"
    },
    delegated_ids: delegatedIds
  } as unknown as Parameters<typeof mapSessionUser>[0];
}

describe("mapSessionUser — the wire's delegated_ids survives the mapping", () => {
  // THE STORY'S WHOLE REASON TO EXIST. `/self` already requested
  // `delegated_ids` as a with-include and the mapper DROPPED it. A mapper that
  // hardcodes `{}` and ignores the wire passes every other case in this suite,
  // because every other case feeds it the recorded `null`.
  it("carries a populated delegated-ids map through onto the session user @AC-DG1", () => {
    const user = mapSessionUser(
      selfWith({
        [UpmindObjectTypes.CONTRACTS_PRODUCT]: ["cp-1", "cp-2"],
        [UpmindObjectTypes.CLIENT]: ["client-2"]
      })
    );

    expect(user.delegatedIds).toEqual({
      [UpmindObjectTypes.CONTRACTS_PRODUCT]: ["cp-1", "cp-2"],
      [UpmindObjectTypes.CLIENT]: ["client-2"]
    });
  });

  it("maps the wire's null to an empty map, never undefined @AC-DG1", () => {
    const user = mapSessionUser(selfWith(null));

    expect(user.delegatedIds).toEqual({});
    expect(user.delegatedIds).not.toBeUndefined();
  });

  it("maps an absent delegated_ids to an empty map @AC-DG1", () => {
    const user = mapSessionUser(selfWith(undefined));

    expect(user.delegatedIds).toEqual({});
  });
});

describe("isDelegated — the oracle's per-object-type branch table", () => {
  it("reports an invoice as delegated when the server's delegation flag is set @AC-DG2", () => {
    const record = invoice({ delegate_related: true });

    expect(isDelegated(record)).toBe(true);
  });

  it("reports an invoice as not delegated when the server's delegation flag is unset @AC-DG2", () => {
    const record = invoice({ delegate_related: false });

    expect(isDelegated(record)).toBe(false);
  });

  it("reports an invoice as NOT delegated when it belongs to a child account, even with the delegation flag set @AC-DG2", () => {
    const record = invoice({
      delegate_related: true,
      client: { parent_client_config: { parent_client_id: "parent-client-1" } }
    });

    expect(isDelegated(record)).toBe(false);
  });

  // THE PARITY-FAITHFULNESS CONTROL. Applying the child-account exclusion
  // uniformly across record types would flip this to `false`, diverging from
  // the oracle on a type the oracle never excludes.
  it("reports a contract product as delegated even when it belongs to a child account @AC-DG2", () => {
    const record = contractProduct({
      is_delegated_object: true,
      client: { parent_client_config: { parent_client_id: "parent-client-1" } }
    });

    expect(isDelegated(record)).toBe(true);
  });

  it("reports a contract product as not delegated when its delegation flag is unset @AC-DG2", () => {
    const record = contractProduct({ is_delegated_object: false });

    expect(isDelegated(record)).toBe(false);
  });

  it("reports a ticket as delegated when its delegation flag is set, with no child-account exclusion @AC-DG2", () => {
    const record = ticket({
      is_delegated_object: true,
      client: { parent_client_config: { parent_client_id: "parent-client-1" } }
    });

    expect(isDelegated(record)).toBe(true);
  });

  it("reports a ticket as not delegated when its delegation flag is unset @AC-DG2", () => {
    const record = ticket({ is_delegated_object: false });

    expect(isDelegated(record)).toBe(false);
  });

  // ORDERS. `IOrder` is an alias of `IInvoice`, so an order flows through the
  // invoice arm. The oracle does exactly this — its orders module maps
  // `belongsToDelegate` onto the invoices getter verbatim
  // (`orders/index.ts:65-68`). These two cases pin that parity so a future
  // refactor cannot split orders off the invoice arm unnoticed.
  it("reports an order as delegated when its delegation flag is set @AC-DG2", () => {
    const order: DelegatableRecord = {
      delegate_related: true
    } as unknown as DelegatableRecord;

    expect(isDelegated(order)).toBe(true);
  });

  it("reports an order as NOT delegated when it belongs to a child account @AC-DG2", () => {
    const order: DelegatableRecord = {
      delegate_related: true,
      client: { parent_client_config: { parent_client_id: "parent-client-1" } }
    } as unknown as DelegatableRecord;

    expect(isDelegated(order)).toBe(false);
  });
});

describe("getOwnerForDelegatedRecord — the owner comes off the record", () => {
  it("resolves to no owner when the record carries no embedded client @AC-DG3", () => {
    const record = invoice({ is_delegated_object: true });

    const owner: DelegatedRecordOwner | undefined =
      getOwnerForDelegatedRecord(record);

    expect(owner).toBeUndefined();
  });

  it("resolves to no owner regardless of the unused delegatedIds argument @AC-DG3", () => {
    const record = invoice({ is_delegated_object: true });

    const owner = getOwnerForDelegatedRecord(record, {
      [UpmindObjectTypes.CLIENT]: ["some-other-client-id"]
    });

    expect(owner).toBeUndefined();
  });

  // Field-by-field, not "is defined": each of the four displayed owner fields
  // must be mapped from its own source field on the record's embedded client,
  // per invoiceDelegateTooltip.vue:4-8,48-50.
  it("resolves the owner's id, display name, username, and avatar from the record's embedded client @AC-DG3", () => {
    const record = invoice({
      is_delegated_object: true,
      client: {
        id: "owner-client-1",
        public_name: "Owner Display Name",
        username: "owner-username",
        image_url: "https://example.com/owner-avatar.png"
      }
    });

    const owner: DelegatedRecordOwner | undefined =
      getOwnerForDelegatedRecord(record);

    expect(owner).toEqual({
      id: "owner-client-1",
      publicName: "Owner Display Name",
      username: "owner-username",
      imageUrl: "https://example.com/owner-avatar.png"
    });
  });
});
