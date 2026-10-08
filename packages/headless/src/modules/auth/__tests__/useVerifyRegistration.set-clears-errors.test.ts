// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing, SET after a refused form (unit)
 *
 * ## Job To Be Done
 * At the set-password step a `SET` after a refused submit validates again.
 * A correcting keystroke leaves no stale error and no stale
 * `hasValidationErrors` flag; a keystroke that keeps the confirmation
 * mismatched keeps the `const` error. Driven through the public
 * `useVerifyRegistration` composable against the recorded verify answer.
 *
 * ## What Breaks If These Fail
 * A guest corrects the confirmation, yet the form keeps showing "Enter the
 * same password again" until the next submit.
 */

import { describe, expect, it, vi } from "vitest";
import {
  VALID_PASSWORD,
  reachSetPassword,
  useLandingHarness
} from "./useVerifyRegistration.kit";

// -----------------------------------------------------------------------------

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

describe("a set after a mismatched confirmation", () => {
  it("keeps the const error while the confirmation is still mismatched", async () => {
    const instance = await reachSetPassword();
    instance.useActions().set({
      password: VALID_PASSWORD.password,
      password_confirmation: `${VALID_PASSWORD.password_confirmation}x`
    });
    await instance.useActions().completeRegistration();

    instance.useActions().set({
      password_confirmation: `${VALID_PASSWORD.password_confirmation}xy`
    });

    expect(instance.useContext().validationErrors.value).toMatchObject([
      { instancePath: "/password_confirmation", keyword: "const" }
    ]);
    expect(instance.useMeta().hasValidationErrors.value).toBe(true);
  });

  it("clears the validation errors and the flag", async () => {
    const instance = await reachSetPassword();
    instance.useActions().set({
      password: VALID_PASSWORD.password,
      password_confirmation: `${VALID_PASSWORD.password_confirmation}x`
    });
    await instance.useActions().completeRegistration();
    expect(instance.useMeta().hasValidationErrors.value).toBe(true);
    expect(instance.useContext().validationErrors.value).toMatchObject([
      { instancePath: "/password_confirmation", keyword: "const" }
    ]);

    instance.useActions().set({
      password_confirmation: VALID_PASSWORD.password_confirmation
    });

    expect(instance.useContext().validationErrors.value).toStrictEqual([]);
    expect(instance.useMeta().hasValidationErrors.value).toBe(false);
    expect(instance.useContext().currentState.value).toBe("needsPassword");
  });
});
