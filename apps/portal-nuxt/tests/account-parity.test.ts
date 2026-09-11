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
});

describe("the account card foots itself with the pinned vault assets", () => {
  it("adds one row to the notes page when anything is pinned, and none when nothing is", () => {
    const data = clone();
    expect(filter(data.vault, { pinned: true }).length).toBeGreaterThan(0);
    const row = find(accountCardItems(data), { id: "pinned-vault" });
    expect(row?.to).toBe("/account/notes");
    expect(row?.description).toMatch(/kept to hand/);
    for (const asset of data.vault) Object.assign(asset, { pinned: false });
    expect(
      find(accountCardItems(data), { id: "pinned-vault" })
    ).toBeUndefined();
  });
});
