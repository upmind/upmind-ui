// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockAccount
 * @description The account the client is signed in AS, managed — the two
 * writes that act on the identity rather than on anything it owns: which of
 * their accounts is in play (legacy's tenancy switcher) and the picture that
 * account wears.
 *
 * The persona is REPLACED rather than mutated in place, exactly as the auth
 * facade replaces it on a password change: `MockPersona`'s members are
 * readonly, and the dataset's own `persona` is the one mutable handle.
 */

import { defineMockFacade, MOCK_RECEIPT_REASON, submittedText } from "./facade";
import { assign, find, some } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type {
  MockDataset,
  MockParentBranding,
  MockPersona,
  MockPersonaAccount
} from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** The accounts this sign-in may act for; a persona with none acts for itself alone. */
export function personaAccounts(
  persona: MockPersona
): readonly MockPersonaAccount[] {
  return persona.accounts ?? [];
}

/** Which account is in play — the named one, or the first on the list. */
export function activePersonaAccount(
  persona: MockPersona
): MockPersonaAccount | undefined {
  const accounts = personaAccounts(persona);
  const named = find(accounts, { id: persona.activeAccountId });
  return named ?? accounts[0];
}

/** Whether there is more than one to switch between — the control's own gate. */
export function hasAccountChoice(persona: MockPersona): boolean {
  return personaAccounts(persona).length > 1;
}

/** The persona, with these members moved — the dataset's handle is the mutable one. */
function replacePersona(
  data: MockDataset,
  changes: Partial<MockPersona>
): MockActionReceipt<MockPersona> {
  assign(data, { persona: assign({}, data.persona, changes) });
  return { ok: true, entity: data.persona };
}

export const useMockAccount = defineMockFacade(
  (data): MockPersona => data.persona,
  data => ({
    /**
     * Puts one of this sign-in's accounts in play. An id the sign-in does not
     * hold names nothing to act for, which is the standing not-found answer.
     */
    switchAccount: (
      accountId: string
    ): MockActionReceipt<MockPersona> | undefined => {
      const held = some(personaAccounts(data.persona), { id: accountId });
      if (!held) return undefined;
      if (data.persona.activeAccountId === accountId) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_ACTIVE,
          entity: data.persona
        };
      }
      return replacePersona(data, { activeAccountId: accountId });
    },

    /**
     * Saves the appearance this account lends to the ones it manages —
     * legacy's `parentBrandAppearanceForm`, whose save posted the name, the
     * colour and the font together. An account lending nothing has no
     * appearance to change.
     */
    saveParentBranding: (
      model: FormModel
    ): MockActionReceipt<MockParentBranding> | undefined => {
      const branding = data.parentBranding;
      if (branding === null) return undefined;
      const saved: MockParentBranding = {
        name: submittedText(model, "name"),
        colour: submittedText(model, "colour"),
        font: submittedText(model, "font"),
        logoSrc: branding.logoSrc
      };
      if (saved.name === "") {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.EMPTY_NAME,
          entity: branding
        };
      }
      assign(data, { parentBranding: saved });
      return { ok: true, entity: saved };
    }
  })
);
