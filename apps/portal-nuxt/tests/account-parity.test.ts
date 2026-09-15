import { describe, expect, it } from "vitest";
import { filter, find } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { accountCardItems } from "~/portal/mock/selectors";

/** Legacy's account screens, graded on vue-app 1.74.0 — the rows `docs/legacy-parity-products.md` sends here. */

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

describe("a username or password change waits on legacy's identity check", () => {
  const change = `${MOCK_ACTION.USERNAME_CHANGE}:${JSON.stringify({ username: "jonah.reyes" })}`;
  const confirm = (data: MockDataset, typed: Record<string, string>) =>
    dispatchMockAction(
      data,
      {},
      `${MOCK_ACTION.SENSITIVE_CODE_CONFIRM}:${change}:${JSON.stringify(typed)}`
    );

  it("opens the prompt instead of changing anything", () => {
    const data = clone();
    const before = data.persona.username;
    const result = dispatchMockAction(data, {}, change);
    expect(result?.form?.id).toBe(FORM_ID.SENSITIVE_CODE);
    expect(result?.form?.entityId).toBe(change);
    expect(data.persona.username).toBe(before);
  });

  it("asks the current password, and lands on the right one", () => {
    const data = clone();
    Object.assign(data.security, { twoFactorEnabled: false });
    expect(confirm(data, { password: "nope" })?.toast?.title).toMatch(
      /password/i
    );
    expect(data.persona.username).not.toBe("jonah.reyes");
    const landed = confirm(data, { password: data.persona.password ?? "" });
    expect(landed?.toast?.title).toBe("Username changed");
    expect(data.persona.username).toBe("jonah.reyes");
  });

  it("asks the second-step code too, only while two-factor is on", () => {
    const data = clone();
    Object.assign(data.security, { twoFactorEnabled: true });
    const password = data.persona.password ?? "";
    expect(confirm(data, { password })?.toast?.title).toMatch(/code/i);
    expect(confirm(data, { password, token: "12" })?.toast?.title).toMatch(
      /code/i
    );
    expect(confirm(data, { password, token: "123456" })?.toast?.title).toBe(
      "Username changed"
    );
  });
});

describe("the account card offers no pinned-vault shortcut", () => {
  it("shows none: legacy offers that to staff only", () => {
    const data = clone();
    expect(filter(data.vault, { pinned: true }).length).toBeGreaterThan(0);
    expect(
      find(accountCardItems(data), { id: "pinned-vault" })
    ).toBeUndefined();
  });
});
