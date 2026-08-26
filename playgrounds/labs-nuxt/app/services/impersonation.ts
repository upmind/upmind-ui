// graphify-out/ consulted: admin API patterns from vue-app oracle, auth.services.staff.ts
import { useQuery } from "@upmind-automation/headless";
import { AccessRoleTypes, TwofaProviders } from "@upmind-automation/types";
import type { IBrand, IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module services/impersonation
 * @description Admin impersonation services for the playground.
 * Provides API-backed client/user search and impersonation token minting.
 *
 * This is a playground affordance, not a headless module. The admin API surface
 * is staff-only; a future headless `useClients`/`useUsers` module would absorb
 * this capability.
 */

export interface ClientSearchResult {
  id: string;
  fullname: string;
  email: string;
  image_url?: string;
  brand_id?: string;
  accounts?: Array<{ brand?: IBrand }>;
}

export interface UserSearchResult {
  id: string;
  fullname: string;
  email: string;
  image_url?: string;
}

interface ClientSearchResponse {
  data: ClientSearchResult[];
}

interface UserSearchResponse {
  data: UserSearchResult[];
}

interface ClientAccessTokenResponse {
  access_token: string;
}

interface UserAccessTokenResponse {
  token: string;
}

/**
 * Search clients via admin API.
 * Filters by brand when brandId is provided.
 */
export async function searchClients(
  query: string,
  options?: { brandId?: string; limit?: number }
): Promise<ClientSearchResult[]> {
  if (!query || query.length < 2) return [];

  const { get, useUrl } = useQuery();
  const limit = options?.limit ?? 12;

  const params: Record<string, string | number> = {
    query,
    limit,
    with: "image,accounts.brand",
    "filter[accounts.id|gt]": 0
  };

  if (options?.brandId) {
    params["filter[accounts.brand_id]"] = options.brandId;
  }

  const response = await get<ClientSearchResponse>({
    queryKey: ["admin", "clients", "search", query, options?.brandId ?? "all"],
    url: useUrl("admin/clients", params),
    withAccessToken: true,
    staleTime: 30_000
  });

  return response.data ?? [];
}

/**
 * Search staff users via admin API.
 */
export async function searchUsers(
  query: string,
  options?: { limit?: number }
): Promise<UserSearchResult[]> {
  if (!query || query.length < 2) return [];

  const { get, useUrl } = useQuery();
  const limit = options?.limit ?? 12;

  const response = await get<UserSearchResponse>({
    queryKey: ["admin", "users", "search", query],
    url: useUrl("admin/users", { query, limit, with: "image" }),
    withAccessToken: true,
    staleTime: 30_000
  });

  return response.data ?? [];
}

/**
 * Mint an impersonation token for a client.
 * Returns an IToken-compatible object for session-store.add().
 * Impersonation tokens have no refresh capability; placeholder values are used.
 */
export async function impersonateClient(clientId: string): Promise<IToken> {
  const { post, useUrl } = useQuery();

  const response = await post<ClientAccessTokenResponse>({
    mutationKey: ["admin", "clients", clientId, "impersonate"],
    url: useUrl(`admin/clients/${clientId}/access_token`),
    withAccessToken: true
  });

  return {
    access_token: response.access_token,
    actor_type: AccessRoleTypes.CLIENT,
    actor_id: clientId,
    expires_in: 0,
    refresh_expires_in: 0,
    refresh_token: "",
    second_factor_required: false,
    token_type: "bearer",
    twofa_provider: TwofaProviders.EMAIL
  };
}

/**
 * Mint an impersonation token for a staff user.
 * Returns an IToken-compatible object for session-store.add().
 * Impersonation tokens have no refresh capability; placeholder values are used.
 */
export async function impersonateUser(userId: string): Promise<IToken> {
  const { post, useUrl } = useQuery();

  const response = await post<UserAccessTokenResponse>({
    mutationKey: ["admin", "users", userId, "impersonate"],
    url: useUrl(`admin/users/${userId}/access_token`),
    withAccessToken: true
  });

  return {
    access_token: response.token,
    actor_type: AccessRoleTypes.STAFF,
    actor_id: userId,
    expires_in: 0,
    refresh_expires_in: 0,
    refresh_token: "",
    second_factor_required: false,
    token_type: "bearer",
    twofa_provider: TwofaProviders.EMAIL
  };
}
