/**
 * @fileoverview Impersonation Services Tests
 * @feature impersonation.feature @AC-R5.1a @AC-R5.1b @AC-R5.2a @AC-R5.2b
 *
 * ## Job To Be Done
 * Staff users can search for clients/users and impersonate them via admin API.
 * These services wrap the API calls defined in design.md (FE-2973 R5).
 *
 * ## What Breaks If These Fail
 * - Staff cannot search for clients to impersonate (broken acting-for flow)
 * - Impersonation tokens are not fetched correctly (wrong endpoint or response shape)
 * - Response shape mismatch: client returns access_token, user returns token
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  impersonateClient,
  impersonateUser,
  searchClients,
  searchUsers
} from "../impersonation";
import type { ClientSearchResult, UserSearchResult } from "../impersonation";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockUseUrl = vi.fn((path: string, params?: Record<string, unknown>) => {
  const url = new URL(`https://api.example.com/${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
});

vi.mock("@upmind-automation/headless", () => ({
  useQuery: () => ({
    get: mockGet,
    post: mockPost,
    useUrl: mockUseUrl
  })
}));

describe("impersonation services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("searchClients @AC-R5.1a", () => {
    const mockClients: ClientSearchResult[] = [
      { id: "client-1", fullname: "John Doe", email: "john@example.com" },
      { id: "client-2", fullname: "John Smith", email: "jsmith@example.com" }
    ];

    it("calls GET /admin/clients with query parameter", async () => {
      mockGet.mockResolvedValue({ data: mockClients });

      await searchClients("john");

      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ["admin", "clients", "search", "john", "all"],
          withAccessToken: true
        })
      );
    });

    it("returns array of ClientSearchResult", async () => {
      mockGet.mockResolvedValue({ data: mockClients });

      const result = await searchClients("john");

      expect(result).toEqual(mockClients);
    });

    it("returns empty array for short queries", async () => {
      const result = await searchClients("j");

      expect(mockGet).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("filters by brandId when provided", async () => {
      mockGet.mockResolvedValue({ data: [] });

      await searchClients("test", { brandId: "brand-123" });

      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ["admin", "clients", "search", "test", "brand-123"]
        })
      );
    });
  });

  describe("searchUsers @AC-R5.2a", () => {
    const mockUsers: UserSearchResult[] = [
      { id: "user-1", fullname: "Admin One", email: "admin1@example.com" },
      { id: "user-2", fullname: "Admin Two", email: "admin2@example.com" }
    ];

    it("calls GET /admin/users with query parameter", async () => {
      mockGet.mockResolvedValue({ data: mockUsers });

      await searchUsers("admin");

      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ["admin", "users", "search", "admin"],
          withAccessToken: true
        })
      );
    });

    it("returns array of UserSearchResult", async () => {
      mockGet.mockResolvedValue({ data: mockUsers });

      const result = await searchUsers("admin");

      expect(result).toEqual(mockUsers);
    });

    it("returns empty array for short queries", async () => {
      const result = await searchUsers("a");

      expect(mockGet).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("impersonateClient @AC-R5.1b", () => {
    it("calls POST /admin/clients/{id}/access_token", async () => {
      mockPost.mockResolvedValue({ access_token: "client-token-xyz" });

      await impersonateClient("client-123");

      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ["admin", "clients", "client-123", "impersonate"],
          withAccessToken: true
        })
      );
    });

    it("returns IToken with access_token and client actor_type", async () => {
      mockPost.mockResolvedValue({ access_token: "client-token-xyz" });

      const result = await impersonateClient("client-123");

      expect(result).toMatchObject({
        access_token: "client-token-xyz",
        actor_type: "client",
        actor_id: "client-123"
      });
    });
  });

  describe("impersonateUser @AC-R5.2b", () => {
    it("calls POST /admin/users/{id}/access_token", async () => {
      mockPost.mockResolvedValue({ token: "user-token-abc" });

      await impersonateUser("user-456");

      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ["admin", "users", "user-456", "impersonate"],
          withAccessToken: true
        })
      );
    });

    it("returns IToken with token and staff actor_type", async () => {
      mockPost.mockResolvedValue({ token: "user-token-abc" });

      const result = await impersonateUser("user-456");

      expect(result).toMatchObject({
        access_token: "user-token-abc",
        actor_type: "user",
        actor_id: "user-456"
      });
    });
  });
});
