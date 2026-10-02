import { describe, expect, it } from "vitest";
import {
  MODULE_STATE_META_FLAG,
  ModuleState,
  resolveModuleState,
  resolveRecordState
} from "../index";

describe("@AC3 resolveModuleState — real composable meta shapes", () => {
  it("resolves loading from the real isLoading flag", () => {
    expect(resolveModuleState({ isLoading: true, hasError: false })).toBe(
      "loading"
    );
  });

  it("resolves error from the collection's hasError flag", () => {
    expect(resolveModuleState({ isLoading: false, hasError: true })).toBe(
      "error"
    );
  });

  it("resolves error from the manager's hasErrors flag", () => {
    expect(resolveModuleState({ isLoading: false, hasErrors: true })).toBe(
      "error"
    );
  });

  it("resolves ready when neither flag is set (collection shape)", () => {
    expect(resolveModuleState({ isLoading: false, hasError: false })).toBe(
      "ready"
    );
  });

  it("resolves ready when neither flag is set (manager shape)", () => {
    expect(resolveModuleState({ isLoading: false, hasErrors: false })).toBe(
      "ready"
    );
  });

  it("resolves loading over a stale error flag when both are true", () => {
    expect(resolveModuleState({ isLoading: true, hasError: true })).toBe(
      "loading"
    );
  });

  it("exposes no scope-invalid flag — deleted, not renamed (R-D1)", () => {
    expect(MODULE_STATE_META_FLAG).not.toHaveProperty("SCOPE_INVALID");
    expect(Object.values(MODULE_STATE_META_FLAG)).not.toContain(
      "isScopeInvalid"
    );
  });
});

describe("resolveRecordState — a record that could not land draws a notice", () => {
  const NOTICE = [ModuleState.ABSENT, ModuleState.ERROR];

  it("resolves an unavailable record to a notice, never the loading skeleton", () => {
    const state = resolveRecordState({ isUnavailable: true }, {});

    expect(NOTICE).toContain(state);
    expect(state).not.toBe(ModuleState.LOADING);
    expect(state).not.toBe(ModuleState.READY);
  });

  it("still shows the loading skeleton while a read is in flight, never a premature notice", () => {
    expect(
      resolveRecordState({ isUnavailable: true, isLoading: true }, {})
    ).toBe(ModuleState.LOADING);
  });

  it("leaves a record that never publishes isUnavailable loading while it loads", () => {
    expect(
      resolveRecordState({ isLoading: true, hasError: false }, { id: "c-1" })
    ).toBe(ModuleState.LOADING);
  });

  it("resolves a contract/ticket record with neither flag set to ready", () => {
    expect(
      resolveRecordState({ isLoading: false, hasError: false }, { id: "c-1" })
    ).toBe(ModuleState.READY);
  });

  it("resolves a contract/ticket record's own error to the error notice", () => {
    expect(
      resolveRecordState({ isLoading: false, hasError: true }, { id: "c-1" })
    ).toBe(ModuleState.ERROR);
  });
});
