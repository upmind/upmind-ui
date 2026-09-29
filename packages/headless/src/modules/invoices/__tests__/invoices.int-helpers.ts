// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.int-helpers
 * @description The scaffolding the scenario runner (`invoices.replay.int.test.ts`)
 * needs: seed a real authenticated client session behind the OWNING modules'
 * boot recordings, and evict this module's scope-registry entries between
 * scenarios. Every module capability is proven by a driven `.feature` scenario
 * replaying its own per-step recordings (FE-3145, ADR 035; operator ruling
 * 2026-09-24), so this file carries no per-test handlers, no observers and no
 * flat-body readers — the deleted capability `*.int.test.ts` files owned those.
 *
 * Every response a seeded session replays comes from a fixture captured against
 * real staging — the owning modules' own recordings and this module's own
 * `pnpm fixtures:generate invoices` scenario captures. The `Envelope` /
 * `WireInvoice` types below are the shape the pure `invoices.mappers.test.ts`
 * reads its recorded rows through.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { AccessRoleTypes } from "@upmind-automation/types";
import { useBrand } from "../../brand";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The Upmind response envelope, as the recorded fixtures carry it. */
export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

/**
 * One invoice row exactly as the recorded wire carries it (see
 * `fixtures/*.json`). Loosely typed — this file is test scaffolding, not the
 * module's `Invoice` VM, and the recorded rows carry many more fields than
 * are named here; only the fields this module's tests read are declared.
 */
export type WireInvoice = {
  id: string;
  status?: { code?: string } | null;
  is_consolidation: boolean;
  consolidation_invoice_id: string | null;
  consolidation_status: number;
  credit_invoice_id: string | null;
  partial_amount_to_credit_converted: number;
  partial_amount_to_credit_formatted: string;
  partial_amount_credited: number;
  to_be_credited: boolean;
  products_count: number;
  products: Array<{
    id: string;
    contract_id: string | null;
    contracts_product_id: string | null;
  }>;
  category: { id: string; name: string; slug: string };
  delegate_related: boolean;
  client: {
    id: string;
    parent_client_config?: { parent_client_id: string } | null;
  };
  next_charge_date?: string | null;
  balance: number;
  balance_formatted: string;
  unpaid_amount: number;
  unpaid_amount_converted: number;
  unpaid_amount_formatted: string;
  currency_id: string;
  currency: { id: string; code: string };
  payments: Array<{
    id: string;
    pending: boolean;
    gateway?: { type?: number } | null;
    created_at: string;
  }>;
  payment_details_id: string | null;
};

/** The brand's own recordings — its boot reads (settings, config, modules). */
const BRAND_RECORDINGS = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

/** The system module's own recordings — countries, billing cycles. */
const SYSTEM_RECORDINGS = join(
  import.meta.dirname,
  "../../system/__tests__/fixtures"
);

/** The basket's own recordings — the claim a client sign-in makes. */
const BASKET_RECORDINGS = join(
  import.meta.dirname,
  "../../basket/__tests__/fixtures"
);

/**
 * The boot reads every signed-in scenario makes as a side effect of
 * `initStore()` — the brand's settings and config, the system's country list and
 * billing cycles, the basket's claim, session-store's own rich `/self` —
 * answered by the RECORDINGS of the modules that OWN them, never by a body
 * written here (FE-3145, ADR 035). Re-applied on every seed; the replay server
 * resets handlers between tests.
 */
export function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, sessionStoreRecordingsDir);
  installGuestTokenStub();
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds in the registry. */
export function invoiceScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => key.startsWith("invoice"));
}

/**
 * Evict every invoices/invoice scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached data, so the shared cache
 * is cleared too.
 */
export function resetInvoiceScopes(): void {
  for (const key of invoiceScopeKeys()) remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

function installGuestTokenStub(): void {
  const guestBody = getFixtureBody("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () => HttpResponse.json(guestBody))
  );
}

function recordedClientCredentials(): {
  clientToken: IToken;
  selfBody: { data: { actor: { id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: sessionStoreRecordingsDir
    }),
    selfBody: getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
      recordingsDir: sessionStoreRecordingsDir
    })
  };
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetInvoiceScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds the guest floor a `@signed-out` scenario boots against: the owning
 * modules' boot recordings are armed and the store settles on a guest session
 * with NO client signed in, so the collection resolves `isAvailable:false` and
 * any invoice request it makes anyway is an unmatched request the replay wall
 * surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetInvoiceScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetInvoiceScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
