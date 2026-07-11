/**
 * @fileoverview useClientEmails — scope resolution + four-layer surface (unit)
 *
 * ## Job To Be Done
 * Prove the scoped client-emails collection resolves SELF to the active actor,
 * exposes the reactive list/lookups through useContext, derives its meta flags
 * from the backing query, and that its actions delegate correctly (ensure →
 * services, remove/verify/setDefault → mutations, destroy → registry eviction)
 * — the query layer mocked.
 *
 * ## What Breaks If These Fail
 * A collection minted for the wrong actor reads another session's emails;
 * consumers reading `useContext().data`/`default` or `useActions().ensure`
 * (client-company, basket-billing) silently break; an unmounted instance leaves
 * a stale singleton the next mount resurrects.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { ScopeActorTypes } from "../../scope";
import { useClientEmails } from "../useClientEmails";
import type { Email } from "../client-email.types";

// -----------------------------------------------------------------------------

// vi.hoisted runs before module imports initialise, so it holds only plain
// data + spies — the ref-backed query is assembled at module scope (below),
// after vue's `ref` import is live, and read lazily by the service mock.
const seed = vi.hoisted(() => {
  const emails = [
    {
      id: "email-1",
      email: "primary@example.com",
      title: "primary@example.com",
      description: "",
      type: 1,
      meta: {
        isDefault: true,
        isVerified: true,
        canDelete: false,
        isBounced: false
      }
    },
    {
      id: "email-2",
      email: "secondary@example.com",
      title: "secondary@example.com",
      description: "",
      type: 1,
      meta: {
        isDefault: false,
        isVerified: false,
        canDelete: true,
        isBounced: false
      }
    }
  ];
  return {
    emails,
    query: undefined as Record<string, unknown> | undefined,
    loadListMock: vi.fn(),
    ensureMock: vi.fn(async () => ({ id: "ensured-email" })),
    removeMutate: vi.fn(),
    verifyMutate: vi.fn(),
    setDefaultMutate: vi.fn(),
    removeMock: vi.fn(),
    verifyMock: vi.fn(),
    setDefaultMock: vi.fn()
  };
});

seed.query = {
  data: ref(seed.emails),
  error: ref(undefined),
  pagination: ref({ total: seed.emails.length }),
  isLoading: ref(false),
  isFetched: ref(true),
  meta: ref({}),
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
  fetchPreviousPage: vi.fn(),
  filter: vi.fn()
};
seed.loadListMock.mockImplementation(() => seed.query);

vi.mock("../client-email.services", () => ({
  default: {
    queryKey: ["client", "emails"],
    loadList: (...args: unknown[]) => seed.loadListMock(...args),
    remove: (...args: unknown[]) => {
      seed.removeMock(...args);
      return { mutate: seed.removeMutate };
    },
    verify: (...args: unknown[]) => {
      seed.verifyMock(...args);
      return { mutate: seed.verifyMutate };
    },
    setDefault: (...args: unknown[]) => {
      seed.setDefaultMock(...args);
      return { mutate: seed.setDefaultMutate };
    }
  },
  useClientEmailServices: () => ({ ensure: seed.ensureMock })
}));

vi.mock("../../query", () => ({
  invalidateQueryByKey: () => () => undefined
}));

vi.mock("../../session-store", () => {
  const context = () => ({
    activeActor: { value: ScopeActorTypes.CLIENT },
    activeUser: { value: { id: "client-1" } }
  });
  return {
    useSessionStore: () => ({ useContext: context }),
    useActiveSession: () => ({
      useContext: context,
      useMeta: () => ({ isAuthenticated: { value: true } }),
      useActions: () => ({ isReady: async () => true })
    })
  };
});

// -----------------------------------------------------------------------------

describe("useClientEmails (scoped collection)", () => {
  beforeEach(() => {
    useClientEmails().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useClientEmails().as(ScopeActorTypes.STAFF).useActions().destroy();
    vi.clearAllMocks();
  });

  it("resolves SELF to the active session actor", () => {
    const internals = useClientEmails().as(ScopeActorTypes.SELF).useInternals();
    expect(internals.actorScope).toBe(ScopeActorTypes.CLIENT);
  });

  it("keeps an explicit actor as given", () => {
    const internals = useClientEmails()
      .as(ScopeActorTypes.STAFF)
      .useInternals();
    expect(internals.actorScope).toBe(ScopeActorTypes.STAFF);
  });

  it("useContext exposes the reactive list and lookups", () => {
    const context = useClientEmails().as(ScopeActorTypes.CLIENT).useContext();

    expect(context.data.value).toHaveLength(2);
    expect(context.getOne("email-2")?.email).toBe("secondary@example.com");
    expect((context.default() as Email)?.id).toBe("email-1");
  });

  it("useMeta derives flags from the backing query", () => {
    const meta = useClientEmails().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.isLoading.value).toBe(false);
    expect(meta.isEmpty.value).toBe(false);
    expect(meta.hasError.value).toBe(false);
    expect(meta.isAvailable.value).toBe(true);
  });

  it("useActions.ensure delegates to the service with the model", async () => {
    const model = { email: "new@example.com" };
    await useClientEmails()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .ensure(model);

    expect(seed.ensureMock).toHaveBeenCalledWith({ model });
  });

  it("useActions.remove/verify/setDefault call the service mutation", () => {
    const actions = useClientEmails().as(ScopeActorTypes.CLIENT).useActions();

    actions.remove("email-2");
    actions.verify("email-2");
    actions.setDefault("email-2");

    expect(seed.removeMock).toHaveBeenCalledWith("email-2");
    expect(seed.removeMutate).toHaveBeenCalled();
    expect(seed.verifyMutate).toHaveBeenCalled();
    expect(seed.setDefaultMutate).toHaveBeenCalled();
  });

  it("is a singleton per scope, and destroy() evicts it", () => {
    // The list query is minted once per scoped instance (in the factory), so
    // the registry's singleton + eviction semantics are proven by how often
    // `loadList` runs: once on first mint, never on a cache hit, and again
    // after destroy() evicts the entry.
    useClientEmails().as(ScopeActorTypes.CLIENT).useInternals();
    useClientEmails().as(ScopeActorTypes.CLIENT).useInternals();
    expect(seed.loadListMock).toHaveBeenCalledTimes(1);

    useClientEmails().as(ScopeActorTypes.CLIENT).useActions().destroy();

    useClientEmails().as(ScopeActorTypes.CLIENT).useInternals();
    expect(seed.loadListMock).toHaveBeenCalledTimes(2);
  });
});
