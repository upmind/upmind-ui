// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing context (unit)
 *
 * ## Job To Be Done
 * Prove each member the landing publishes reads its machine field: the mapped
 * verify data, the error, the validation errors, the form model, the redirect
 * target, the provider, the session id, the schemas and the state name.
 *
 * ## What Breaks If These Fail
 * A consumer renders the set-password form without a mismatch error, shows the
 * wrong provider, or cannot read why the landing refused the link.
 */

import { describe, expect, it, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VERIFY_ROUTE,
  landing,
  overrideSelf,
  reachSetPassword,
  recordingsDir,
  serve,
  useLandingHarness
} from "./useVerifyRegistration.kit";
import { get, keys, sortBy, toLower } from "lodash-es";

// -----------------------------------------------------------------------------

const recorded = (key: string) => getFixture(key, { recordingsDir }).response;

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

describe("registration landing context", () => {
  it("publishes nothing before the verify and the idle state name", () => {
    const context = landing().useContext();

    expect(context.currentState.value).toBe("idle");
    expect(context.data.value).toBeUndefined();
    expect(context.error.value).toBeUndefined();
    expect(context.redirect.value).toBeUndefined();
    expect(context.sessionId.value).toBeUndefined();
    expect(context.twoFAProvider.value).toBeNull();
  });

  it("publishes the mapped verify data and the provider after the verify", async () => {
    const instance = await reachSetPassword();
    const context = instance.useContext();

    expect(context.data.value).toMatchObject({ needsPassword: true });
    expect(context.twoFAProvider.value).toBe(
      toLower(get(recorded(RECORDING.noPassword).body, "data.twofa_provider"))
    );
  });

  it("publishes the form model with the link username and the form schema", async () => {
    const context = (await reachSetPassword()).useContext();

    expect(context.model.value?.username).toBe(LINK.username);
    expect(sortBy(keys(get(context.schema.value, "properties")))).toStrictEqual(
      ["password", "password_confirmation", "username"]
    );
  });

  it("publishes the mismatch error of the confirmation", async () => {
    const instance = await reachSetPassword();
    instance.useActions().set({
      password: "abcdefg1",
      password_confirmation: "abcdefg2"
    });

    await instance.useActions().completeRegistration();

    expect(instance.useContext().validationErrors.value).toMatchObject([
      { instancePath: "/password_confirmation", keyword: "const" }
    ]);
  });

  it("publishes the filtered redirect of the link", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const instance = landing();

    await instance.useActions().verify({ ...LINK, redirect: "/billing" });
    await instance.useActions().isReady();

    expect(instance.useContext().redirect.value).toBe("/billing");
  });

  it("publishes the error of a refused link", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useContext().error.value?.status).toBe(
      recorded(RECORDING.invalidHash).status
    );
  });

  it("publishes the session id of the activated account", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantDirect);
    overrideSelf(RECORDING.self);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useContext().sessionId.value).toBe(
      get(recorded(RECORDING.grantDirect).body, "actor_id")
    );
  });
});
