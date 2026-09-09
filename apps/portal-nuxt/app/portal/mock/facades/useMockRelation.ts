// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockRelation
 * @description ONE parent/child relation, managed — the mock stand-in for the
 * `useClientRelation` manager §3 hands to the factory: the two halves of
 * legacy's login-as-child flow (plan R10), breaking the relation, and the
 * three switches its manage-relation panel offers.
 *
 * Logging in as a child is a PERSONA SWAP: the dataset's persona becomes the
 * child's and the ribbon holds the parent for the way back
 * (`mock/impersonation.ts`). No token, no session transfer — the identity
 * machinery stays out of the mock.
 */

import { useMockImpersonation } from "../impersonation";
import { defineMockFacade, MOCK_RECEIPT_REASON } from "./facade";
import { assign, find, remove } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { ClientRelationToggleKeys } from "../contracts";
import type { MockChildAccount, MockPersona } from "../types";

/** The child, as the persona the portal then renders as. */
function personaFor(child: MockChildAccount): MockPersona {
  return {
    id: child.child_client_id,
    name: child.name,
    email: child.email
  };
}

export const useMockRelation = defineMockFacade(
  (data, relationId): MockChildAccount | undefined =>
    find(data.childAccounts, { id: relationId }),
  (data, relationId) => ({
    /** Becomes the child and raises the ribbon; a relation that forbids it refuses. */
    loginAs: (): MockActionReceipt<MockChildAccount> | undefined => {
      const child = find(data.childAccounts, { id: relationId });
      if (child === undefined) return undefined;
      if (!child.allow_impersonation) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.IMPERSONATION_REFUSED,
          entity: child
        };
      }
      useMockImpersonation().begin(child.name, data.persona);
      assign(data, { persona: personaFor(child) });
      return { ok: true, entity: child };
    },

    /** Becomes the parent again and lowers the ribbon; no ribbon showing is a no-op. */
    endImpersonation: (): MockActionReceipt<MockPersona> | undefined => {
      const parent = useMockImpersonation().end();
      if (parent === undefined) return undefined;
      assign(data, { persona: parent });
      return { ok: true, entity: parent };
    },

    /** Breaks the parent/child relation — the child keeps its own account. */
    detach: (): MockActionReceipt<MockChildAccount> | undefined => {
      const child = find(data.childAccounts, { id: relationId });
      if (child === undefined) return undefined;
      remove(data.childAccounts, { id: relationId });
      return { ok: true, entity: child };
    },

    /** Flips one relation switch — the three the manage-relation panel offers. */
    toggle: (
      key: ClientRelationToggleKeys
    ): MockActionReceipt<MockChildAccount> | undefined => {
      const child = find(data.childAccounts, { id: relationId });
      if (child === undefined) return undefined;
      assign(child, { [key]: !child[key] });
      return { ok: true, entity: child };
    }
  })
);
