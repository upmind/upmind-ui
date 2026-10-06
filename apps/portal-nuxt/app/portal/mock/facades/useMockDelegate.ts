// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockDelegate
 * @description ONE delegate, managed — the mock stand-in for the
 * `useClientDelegate` manager (`contracts/client-delegates.ts`). A
 * whole-account delegate reaches everything already, so the per-object grants
 * this writes only ever matter to a SPECIFIC-access one; the contract's own
 * `toggleObject` is that write. Beside it, `useMockDelegates` — the
 * COLLECTION's own stand-in, which sends the invitation.
 */

import { DelegateObjectTypes } from "@upmind-automation/types";
import { DelegateAccessTypes } from "../contracts";
import { today } from "../dates";
import { MOCK_DELEGATE_STATUS } from "../types";
import {
  defineMockFacade,
  MOCK_RECEIPT_REASON,
  mockId,
  submittedText
} from "./facade";
import {
  assign,
  concat,
  find,
  isEqual,
  isString,
  map,
  reject,
  remove,
  some,
  toLower,
  uniq
} from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MockDataset, MockDelegate, MockDelegateObject } from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** Whether this delegate reaches one named object — the switch's own checked state. */
export function hasDelegateObject(
  delegate: MockDelegate,
  objectType: DelegateObjectTypes,
  objectId: string
): boolean {
  if (delegate.isFullDelegate === true) return true;
  return (
    find(delegate.objects, { type: objectType, id: objectId }) !== undefined
  );
}

export const useMockDelegate = defineMockFacade(
  (data, delegateId): MockDelegate | undefined =>
    find(data.delegates, { id: delegateId }),
  (data, delegateId) => {
    function delegate(): MockDelegate | undefined {
      return find(data.delegates, { id: delegateId });
    }

    return {
      /** Grants or revokes one object for this delegate — legacy's per-product switch. */
      toggleObject: (
        objectType: DelegateObjectTypes,
        objectId: string
      ): MockActionReceipt<MockDelegate> | undefined => {
        const subject = delegate();
        if (subject === undefined) return undefined;
        const grant: MockDelegateObject = { type: objectType, id: objectId };
        const held = find(subject.objects, grant) !== undefined;
        if (held) {
          assign(subject, {
            objects: reject(subject.objects, candidate =>
              isEqual(candidate, grant)
            )
          });
          return { ok: true, entity: subject };
        }
        assign(subject, { objects: [...subject.objects, grant] });
        return { ok: true, entity: subject };
      },

      /** Revokes the delegation entirely — the grants go with the delegate. */
      remove: (): MockActionReceipt<MockDelegate> | undefined => {
        const subject = delegate();
        if (subject === undefined) return undefined;
        remove(data.delegates, { id: delegateId });
        return { ok: true, entity: subject };
      },

      /**
       * Switches between whole-account and per-object access. Moving to FULL
       * clears the grants: they are what a specific-access delegate reaches,
       * and a delegate who reaches everything has nothing left for them to
       * mean — leaving them would resurrect stale grants on the way back.
       */
      setAccessType: (
        value: DelegateAccessTypes
      ): MockActionReceipt<MockDelegate> | undefined => {
        const subject = delegate();
        if (subject === undefined) return undefined;
        const isFull = value === DelegateAccessTypes.FULL;
        if (isFull) {
          assign(subject, { isFullDelegate: true, objects: [] });
          return { ok: true, entity: subject };
        }
        assign(subject, { isFullDelegate: false });
        return { ok: true, entity: subject };
      }
    };
  }
);

/** One submitted multi-select — anything but a list of strings names nothing. */
function submittedIds(model: FormModel, key: string): string[] {
  const value = model[key];
  if (!Array.isArray(value)) return [];
  return map(
    reject(value, entry => !isString(entry)),
    String
  );
}

/**
 * What a whole-account delegate may do. Legacy's own invitation granted the
 * account's standing set, which the seeded full delegate wears
 * (`hostgrid.ts` `dlg-2`); there is no per-permission control on the form.
 */
const FULL_DELEGATE_PERMISSIONS: readonly string[] = [
  "View invoices",
  "Pay invoices"
];

/** What one granted object lets a specific delegate do. */
const OBJECT_PERMISSION: Readonly<Record<DelegateObjectTypes, string>> = {
  [DelegateObjectTypes.CLIENT]: "View the account",
  [DelegateObjectTypes.CONTRACT_PRODUCT]: "Manage products",
  [DelegateObjectTypes.TICKET]: "Reply to tickets"
};

/**
 * What the invitation lets them do — DERIVED from what it granted, never
 * asked for: the form offers an access type and two pickers, so a permission
 * the model does not carry can only come from what those two say.
 */
function invitedPermissions(
  isFullDelegate: boolean,
  objects: readonly MockDelegateObject[]
): string[] {
  if (isFullDelegate) return [...FULL_DELEGATE_PERMISSIONS];
  return uniq(map(objects, grant => OBJECT_PERMISSION[grant.type]));
}

/**
 * What an invitation grants. A whole-account delegate reaches everything
 * already, so the grants a FULL invitation named would mean nothing — the
 * same reasoning `setAccessType` clears them on.
 */
function invitedObjects(
  data: MockDataset,
  model: FormModel,
  isFullDelegate: boolean
): MockDelegateObject[] {
  if (isFullDelegate) return [];
  const products = map(
    submittedIds(model, "productIds"),
    (id): MockDelegateObject => ({
      type: DelegateObjectTypes.CONTRACT_PRODUCT,
      id
    })
  );
  const tickets = map(
    submittedIds(model, "ticketIds"),
    (id): MockDelegateObject => ({ type: DelegateObjectTypes.TICKET, id })
  );
  return concat(
    reject(
      products,
      grant => find(data.products, { id: grant.id }) === undefined
    ),
    reject(tickets, grant => find(data.tickets, { id: grant.id }) === undefined)
  );
}

/**
 * The delegate COLLECTION, managed — the mock stand-in for
 * `useClientDelegates` (`contracts/client-delegates.ts`). Inviting is a
 * collection write, as adding an email is (`useMockContacts`): there is no
 * per-delegate scope to carry a delegate who does not exist yet.
 */
export const useMockDelegates = defineMockFacade(
  (data): readonly MockDelegate[] => data.delegates,
  data => ({
    /**
     * Invites one person. The invitation is PENDING until they take it up, so
     * the row carries the email as its name: a delegate has no name of their
     * own on this account until they accept and bring one.
     */
    invite: (model: FormModel): MockActionReceipt<MockDelegate> => {
      const email = submittedText(model, "email");
      const held = some(
        data.delegates,
        delegate => toLower(delegate.email) === toLower(email)
      );
      if (held) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.DUPLICATE_DELEGATE };
      }

      const isFullDelegate =
        submittedText(model, "accessType") === DelegateAccessTypes.FULL;
      const objects = invitedObjects(data, model, isFullDelegate);
      const created: MockDelegate = {
        id: mockId("delegate", map(data.delegates, "id")),
        name: email,
        email,
        permissions: invitedPermissions(isFullDelegate, objects),
        isFullDelegate,
        // Invited just now — the day legacy's own listing ordered by.
        invitedAt: today(),
        status: MOCK_DELEGATE_STATUS.PENDING,
        objects
      };
      data.delegates.push(created);
      return { ok: true, entity: created };
    }
  })
);
