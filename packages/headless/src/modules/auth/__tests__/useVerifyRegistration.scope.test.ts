// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing scope resolution (unit)
 *
 * ## Job To Be Done
 * Prove that the landing resolves "self" to the acting actor, that one scope
 * serves one instance, and that a signed-in client gets a separate instance
 * from the guest one.
 *
 * ## What Breaks If These Fail
 * Two consumers of one landing see two machines, or a client who opens the
 * link reuses the guest instance and its stale outcome.
 */

import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import { ScopeActorTypes } from "../../scope";
import { persistTokenToStorage, useSessionStore } from "../../session-store";
import {
  RECORDING,
  landing,
  recordingsDir,
  useLandingHarness
} from "./useVerifyRegistration.kit";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

describe("registration landing scope", () => {
  it("resolves self to the guest when no client is signed in", () => {
    expect(landing().useInternals().actorScope).toBe(ScopeActorTypes.GUEST);
  });

  it("returns one instance for two calls in one scope", () => {
    expect(landing().useInternals().service).toBe(
      landing().useInternals().service
    );
  });

  it("keys a new instance once a client is signed in", async () => {
    const guestService = landing().useInternals().service;
    await persistTokenToStorage(
      getFixture(RECORDING.grantDirect, { recordingsDir }).response
        .body as unknown as IToken
    );
    await vi.waitFor(() => {
      if (!useSessionStore().useMeta().hasClientSession.value) {
        throw new Error("session still settling");
      }
    });

    const clientInstance = landing();

    expect(clientInstance.useInternals().actorScope).toBe(
      ScopeActorTypes.CLIENT
    );
    expect(clientInstance.useInternals().service).not.toBe(guestService);
  });
});
