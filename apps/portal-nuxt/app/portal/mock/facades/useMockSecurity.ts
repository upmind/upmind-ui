// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockSecurity
 * @description The account's sign-in posture, managed — the mock stand-in for
 * `useClientSecurity` (`contracts/client-security.ts`). One record, three
 * writes: a new password, and the second sign-in step on or off.
 *
 * The password is never stored. A mock with no session has nothing to check a
 * password against and nothing to sign in with, so the write records WHEN it
 * changed — the one fact the security panel states — and refuses the one
 * thing it can honestly judge, that the two fields were typed the same
 * (plan F5: a business rule is a receipt, never a schema error).
 */

import { today } from "../dates";
import { defineMockFacade, MOCK_RECEIPT_REASON, submittedText } from "./facade";
import { assign, size } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MockSecurity } from "../types";
import type { FormModel } from "@upmind/ui";

/** How long an authenticator code is — the real twofa schema's own `\d{6}`. */
const TWO_FACTOR_CODE_LENGTH = 6;

const DIGITS_ONLY = /^\d+$/;

/** The mock accepts ANY six digits: there is no authenticator to agree with. */
export function isCodeShaped(code: string): boolean {
  const isRightLength = size(code) === TWO_FACTOR_CODE_LENGTH;
  const isAllDigits = DIGITS_ONLY.test(code);
  return isRightLength && isAllDigits;
}

export const useMockSecurity = defineMockFacade(
  (data): MockSecurity => data.security,
  data => {
    /** The one write every password door ends in — the sign-in secret and the date it moved. */
    function applyNewPassword(
      password: string
    ): MockActionReceipt<MockSecurity> {
      assign(data.persona, { password });
      assign(data.security, { passwordChangedAt: today() });
      return { ok: true, entity: data.security };
    }

    return {
      /**
       * Legacy's reset link: the new password lands, after the second-step code
       * where the account signs in with two-factor (`resetPasswordForm`).
       */
      resetPassword: (
        model: FormModel
      ): MockActionReceipt<MockSecurity> | undefined => {
        if (
          data.security.twoFactorEnabled &&
          !isCodeShaped(submittedText(model, "token"))
        ) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE,
            entity: data.security
          };
        }
        return applyNewPassword(submittedText(model, "password"));
      },

      /** Legacy's account-verification link that still wants a password: it lands, code unasked. */
      setPassword: (
        model: FormModel
      ): MockActionReceipt<MockSecurity> | undefined =>
        applyNewPassword(submittedText(model, "password")),

      /** Sets a new password; a confirmation that does not match refuses. */
      changePassword: (
        model: FormModel
      ): MockActionReceipt<MockSecurity> | undefined => {
        const password = submittedText(model, "password");
        const confirmation = submittedText(model, "passwordConfirm");
        if (password !== confirmation) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.PASSWORD_MISMATCH,
            entity: data.security
          };
        }
        assign(data.security, { passwordChangedAt: today() });
        return { ok: true, entity: data.security };
      },

      /** Turns the second sign-in step on, against a code the client reads off their authenticator. */
      enableTwoFactor: (
        model: FormModel
      ): MockActionReceipt<MockSecurity> | undefined => {
        const code = submittedText(model, "token");
        if (!isCodeShaped(code)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE,
            entity: data.security
          };
        }
        assign(data.security, { twoFactorEnabled: true });
        return { ok: true, entity: data.security };
      },

      /**
       * Turns the second sign-in step off. Legacy asked for the code on the way
       * OUT as well as the way in — its DELETE carried the same `auth_code` its
       * POST did (`configure2faModal.vue:112-124`) — so the step is only taken
       * off by somebody holding the app that put it on. Asked BEFORE the write.
       */
      disableTwoFactor: (
        model: FormModel
      ): MockActionReceipt<MockSecurity> | undefined => {
        const code = submittedText(model, "token");
        if (!isCodeShaped(code)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE,
            entity: data.security
          };
        }
        assign(data.security, { twoFactorEnabled: false });
        return { ok: true, entity: data.security };
      }
    };
  }
);
