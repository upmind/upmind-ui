// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockIpWhitelist
 * @description The addresses this account may sign in from, managed — the
 * mock stand-in for `useClientIpWhitelist`
 * (`contracts/client-ip-whitelist.ts`). Adding one asks for an address and the
 * name the client knows it by (`client-ip-whitelist.schemas.ts`); removing one
 * asks nothing.
 */

import {
  defineMockFacade,
  MOCK_RECEIPT_REASON,
  mockId,
  submittedText
} from "./facade";
import { assign, find, map, remove, some, toLower } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MockIpAddress } from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

export const useMockIpWhitelist = defineMockFacade(
  (data): readonly MockIpAddress[] => data.ipWhitelist,
  data => ({
    /** Restricts sign-in to one more address; one already listed refuses. */
    create: (model: FormModel): MockActionReceipt<MockIpAddress> => {
      const address = submittedText(model, "ipAddress");
      const held = some(
        data.ipWhitelist,
        entry => toLower(entry.ip_address) === toLower(address)
      );
      if (held) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.DUPLICATE_CONTACT };
      }
      const stamped = new Date().toISOString();
      const created: MockIpAddress = {
        id: mockId("ip", map(data.ipWhitelist, "id")),
        ip_address: address,
        name: submittedText(model, "description"),
        created_at: stamped,
        updated_at: stamped
      };
      data.ipWhitelist.push(created);
      return { ok: true, entity: created };
    },

    /**
     * Moves one listed address — legacy's own edit
     * (`ipWhitelistManageModal.vue:82-84`). An id nobody holds and an address
     * ANOTHER entry already lists both refuse, so the write answers the same
     * two questions the add does.
     */
    update: (
      addressId: string,
      model: FormModel
    ): MockActionReceipt<MockIpAddress> => {
      const entry = find(data.ipWhitelist, { id: addressId });
      if (entry === undefined) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
      }
      const address = submittedText(model, "ipAddress");
      const heldElsewhere = some(
        data.ipWhitelist,
        other =>
          other.id !== addressId &&
          toLower(other.ip_address) === toLower(address)
      );
      if (heldElsewhere) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.DUPLICATE_CONTACT,
          entity: entry
        };
      }
      assign(entry, {
        ip_address: address,
        name: submittedText(model, "description"),
        updated_at: new Date().toISOString()
      });
      return { ok: true, entity: entry };
    },

    /** Lifts the restriction on one address. */
    remove: (
      addressId: string
    ): MockActionReceipt<MockIpAddress> | undefined => {
      const entry = find(data.ipWhitelist, { id: addressId });
      if (entry === undefined) return undefined;
      remove(data.ipWhitelist, { id: addressId });
      return { ok: true, entity: entry };
    }
  })
);
