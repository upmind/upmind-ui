// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.account-member-guard — a manager whose pinned
 * account has left the client's own account list shows a real, translated
 * "not a member" error (unnumbered — design.md §8.4 "If the pinned id
 * leaves `activeUser.accounts`, the service sends no request and returns
 * the membership failure")
 *
 * ## Job To Be Done
 * Protect the save-service membership guard surfacing a REAL, TRANSLATED
 * error — `t('error.affiliate_account_not_member')` — never the bare,
 * untranslated i18n key, on BOTH managers, when the account a manager
 * opened for is no longer in the client's own `accounts` list by the time it
 * saves. This guard survives R-NO-SWITCH's removal of account switching
 * (review-notes.md 2026-09-30): it is not a switch mechanism, it is a
 * defence against the account disappearing from the client's own list,
 * reachable with a single real account.
 *
 * ## How the pinned-id-leaves state is reached
 * The SAME real client session `seedRealClient()` seeds, with its own
 * account live-removed from `accounts` via a second, real
 * `useSessionStore().useActions().add()` call for the SAME session — the
 * production path a server-driven account change takes, never a hand-rolled
 * membership shortcut or a direct machine/context write.
 *
 * ## What Breaks If These Fail
 * A client who tries to save a form for an account the server no longer
 * lists under their own session would see the bare i18n key string, or a
 * request would go out to an account they no longer hold.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { mapSessionUser, useSessionStore } from "../../session-store";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import { recordedSelf, seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";
import type { ISelf } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

// `@workspace/no-cross-package-path-imports` bars a relative path reaching
// across a package boundary — see setup.integration.ts's own comment for the
// full citation of this sibling `readFileSync(join(...))` pattern.
// `join(import.meta.dirname, ...)`, never `resolve(process.cwd(), ...)` — the
// latter breaks if vitest runs from a cwd other than `packages/headless`
// (pseudo-Nathan review pass 20). `import.meta.dirname` itself is NOT the
// broken primitive setup.integration.ts's own `recordingsDir` comment names —
// a scratch probe this pass confirmed `import.meta.dirname` resolves a real,
// correct absolute path in this exact happy-dom integration project; only
// `new URL(relative, import.meta.url).pathname` is the broken construction.
const errorEn = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/error-en.json"),
    "utf-8"
  )
) as Record<string, string>;

/**
 * Removes the pinned account from the client's own `accounts` list through
 * the SAME real session-store path `seedRealClient()` used to add it — a
 * second `add()` call for the identical session, carrying an emptied
 * `accounts` array. Never a direct write to the manager's own context.
 */
async function removePinnedAccountFromSession(): Promise<void> {
  const self = recordedSelf();
  const emptied: ISelf = { ...self, accounts: [] };

  await useSessionStore()
    .useActions()
    .add(
      {
        access_token: "affiliate-int-test-session-token",
        actor_id: self.actor_id,
        actor_type: AccessRoleTypes.CLIENT,
        expires_in: 3600,
        refresh_expires_in: 36000,
        refresh_token: "affiliate-int-test-refresh-token",
        second_factor_required: false,
        token_type: "Bearer",
        twofa_provider: undefined as never
      },
      true,
      mapSessionUser(emptied)
    );
}

describe("affiliate.account-member-guard — a manager whose pinned account has left the client's own account list shows a real, translated not-a-member error", () => {
  it("A manager whose pinned account has left the client's own account list shows a real, translated not-a-member error — the payout destination manager", async () => {
    await seedRealClient();

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      await removePinnedAccountFromSession();

      let saves = 0;
      server?.events.on("request:start", ({ request }) => {
        if (
          request.method === "PUT" &&
          /\/accounts\/[^/]+$/.test(new URL(request.url).pathname)
        ) {
          saves += 1;
        }
      });

      await manager.useActions().update();

      expect(saves).toBe(0);
      expect(manager.useMeta().hasError.value).toBe(true);
      // The real, translated sentence (read from the actual locale file,
      // never hand-typed) — never the bare, untranslated key string a
      // dropped `error.` prefix (the i18n-namespace control) would leave
      // unresolved.
      expect(manager.useContext().errors.value).toBe(
        errorEn.affiliate_account_not_member
      );
    } finally {
      manager.useActions().destroy();
    }
  });

  it("A manager whose pinned account has left the client's own account list shows a real, translated not-a-member error — the link manager", async () => {
    await seedRealClient();

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      await removePinnedAccountFromSession();

      let saves = 0;
      server?.events.on("request:start", ({ request }) => {
        const url = new URL(request.url);
        if (
          (request.method === "POST" || request.method === "PUT") &&
          /\/affiliate\/links/.test(url.pathname)
        ) {
          saves += 1;
        }
      });

      await manager.useActions().update();

      expect(saves).toBe(0);
      expect(manager.useMeta().hasError.value).toBe(true);
      expect(manager.useContext().errors.value).toBe(
        errorEn.affiliate_account_not_member
      );
    } finally {
      manager.useActions().destroy();
    }
  });
});
