import { describe, expect, it } from "vitest";
import { MODULE_STATE_META_FLAG, resolveModuleState } from "../index";

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
