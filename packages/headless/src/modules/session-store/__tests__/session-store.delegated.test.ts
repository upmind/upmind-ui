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
import { isDelegated, getOwnerForDelegatedRecord } from "..";
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
