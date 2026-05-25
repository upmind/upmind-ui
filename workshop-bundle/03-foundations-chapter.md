# Foundations: how clients talk to the Upmind platform

> Read this chapter once at workshop kickoff, before any feature. The four concerns below — HTTP transport, auth, currency, error normalisation — are cross-cutting. Every feature you build assumes they are in place. If they aren't, the feature reinvents them in a worse shape and the codebase splinters.

This chapter describes **what the platform expects** from a caller, not **how Upmind built it**. The reference implementation in `packages/headless` is one shape; your prototype is another. The contract is what matters.

What's in scope:

1. **HTTP transport** — base URL, request shape, response envelope, retries, timeouts
2. **Auth lifecycle** — bearer tokens, refresh, in-flight behaviour during refresh, logout
3. **Currency injection** — where the active currency comes from and how it reaches each call
4. **Error model** — what the platform returns on failure, what your foundations layer normalises

What's **not** in scope for the prototype: i18n, analytics. The platform supports both, the module foundation docs reference both, but the workshop deliverable is a working cart spine — translation and tracking are post-workshop work.

---

## 1. HTTP transport

### 1.1 Base URL and host

Two URLs matter and they are **not the same**:

| URL | Role | Example |
|---|---|---|
| `api_base` | The host every request actually goes to. Same for every brand. Host only — no trailing path. | `https://api.upmind.io` or `https://api.staging.upmind.io` |
| `brand_domain` | The host the **browser** runs on. The platform reads `Host:` off the request and resolves the brand from it. | `contabo-workshop.upmind.app` |

The platform identifies *which brand* you're talking to by looking at the host header on the request. `localhost` is not a brand — every request from a dev server bound to `localhost` will be rejected, mis-routed, or return defaults. Section 4 of the workshop initiator (`docs/workshop/_initiator/generic.md`) covers the hosts-file + TLS setup that makes `https://<brand_domain>` resolve to your dev server. Get that working first; nothing else will function until it does.

> **Path-prefix routing — TWO prefixes, not one.** The Upmind API splits its surface between two top-level path namespaces, and **the transport layer must apply the right one per request**.
>
> | Path family | Real URL on the wire | Examples |
> | --- | --- | --- |
> | OAuth / auth grants | `${api_base}/oauth/<path>` — **host root, NO `/api/`** | `POST /oauth/access_token` (every grant — guest, password, refresh, twofa, auth_code) |
> | Everything else | `${api_base}/api/<path>` — **prepended `/api/`** | `GET /countries`, `POST /clients/register`, `GET /brand/settings`, `POST /orders`, `POST /payments`, every basket / catalogue / panel / invoice endpoint |
>
> The agent writes logical paths in feature code (`request("POST", "/oauth/access_token", ...)` or `request("GET", "/countries")`). The transport layer reads the leading segment and prepends accordingly: `/oauth/*` → no prefix; everything else → prepend `/api/`. **Do not bake either prefix into `api_base`** — the value is host-only, and the prefix selection lives in the transport.
>
> Concretely:
>
> - `request("POST", "/oauth/access_token", { grant_type: "guest" })` → wire = `POST https://api.staging.upmind.io/oauth/access_token`
> - `request("GET", "/countries", { lang: "en" })` → wire = `GET https://api.staging.upmind.io/api/countries?lang=en`
> - `request("POST", "/clients/register", { ... })` → wire = `POST https://api.staging.upmind.io/api/clients/register`
>
> **Failure mode if you get this wrong:**
>
> - Always prepend `/api/`: guest mint, login, refresh all `404`. Workshop won't start.
> - Never prepend `/api/`: every non-auth call `404`s. Catalogue browse, basket, panel all fail.
> - Hard-code either into `api_base`: copy-pasted curl examples double-prefix.
>
> All examples in this chapter and all SDD endpoints are written as **logical paths** — assume the transport applies the right prefix. The validation checklist in §6 verifies this.

In practice this means:

- `fetch()` calls target `${api_base}/oauth/<path>` for grants, `${api_base}/api/<path>` for everything else.
- Feature code never includes either prefix in the path it passes to the transport.
- The browser tab the user has open is on `${brand_domain}`.
- The `Origin` and `Host` headers the browser sets are what the platform uses to identify the brand and pick the right CORS configuration.

> **Asset URL resolution.** Some response fields carry paths, not absolute URLs — most commonly product / brand `image_url` values, which come back as platform-relative paths like `/api/images/{id}/download`. Binding these directly to `<img src>` resolves them against the **browser's current origin** (the brand domain on `localhost`), which serves a 404. The foundations layer needs a small helper:
>
> ```ts
> // Resolve a platform-relative path (with or without leading slash) against the API host.
> // Absolute URLs pass through unchanged.
> function resolveAssetUrl(pathOrUrl: string | null | undefined): string | null {
>   if (!pathOrUrl) return null;
>   if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
>   const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
>   return `${apiBase}${path}`;
> }
> ```
>
> Apply at the boundary — either when consuming the response in the foundations layer's mapper, or before binding to a DOM attribute. Don't make feature code re-derive the rule every time it touches an image. Affected fields: `image_url`, `logo_url`, `favicon_url`, `email_logo_url`, any `*_url` returned by the platform that doesn't start with `https://`.

### 1.2 Request envelope conventions

Most reads are plain `GET`s with query parameters. The conventions:

- **Localisation** — every read accepts a `?lang=<bcp47>` query parameter (e.g. `?lang=en`, `?lang=en-US`). Out of scope for the prototype; pass `?lang=en` and move on. One exception: the auth-code transfer redemption (`POST /oauth/access_token` with `grant_type: "auth_code"`) deliberately accepts no `lang` — see section 2.5.
- **Expands** — relations are pulled inline with `?with=<csv>`. Example from invoices: `?with=brand,taxes,client,gateway,products,promotions`. Without `with`, you get the base record and ids you have to follow up on.
- **Relation counts** — `?with_count=<csv>` adds a server-side count of the named relation to each row's envelope without inflating the full relation. Example: `?with_count=products` on an invoice list returns each invoice's `products_count` without expanding the products array. Cheaper than `with=products` when you only need the count (e.g. for a "3 items" badge).
- **Filters** — list endpoints take `?filter[<field>]=<value>`. Dotted paths reach into relations: `?filter[status.code]=invoice_paid` filters by the embedded status relation's `code` field, not a top-level column. Bracketed keys with dotted paths is the canonical filter syntax — used across `?filter[status.code]`, `?filter[category.slug]`, `?filter[client.email]`, etc.
  - **Filter caveat — server-side status filters can disagree with client-side derivation.** A `?filter[status.code]=invoice_paid` query can miss invoices in transitional states that are nevertheless effectively paid (e.g. consolidated, partially paid with full coverage). For "paid count" stat cards, derive client-side from the same predicate the badge uses, not from a server-side status filter. See invoices.md / SDD 07 multi-signal paid detection.
- **Pagination + counts** — list endpoints take `?limit=<n>&page=<n>` (or `&offset=<n>`).
  - `limit=0` means "no pagination, give me everything"; use sparingly on small reference data (countries, billing cycles).
  - `limit=count` is a **magic platform value** — returns `envelope.total` without fetching any rows. Useful for stat-card counts ("X invoices total", "Y unpaid") without paying for row data the UI doesn't render. The server still does the count work; for hot dashboards consider caching the value rather than re-querying.
  - `skip_count=1` is a query param that tells the platform NOT to compute `envelope.total` — saves the server-side `COUNT(*)` on list reads where the caller doesn't need the total. Standard pattern for the customer-facing invoice list (the user paginates by clicking "next page", not by jumping to "page 47 of 92").
  - These three pagination knobs are mutually-relevant: use `limit=count` for explicit count-only reads; use `limit=20&skip_count=1` for paginated list reads where total is unneeded; use `limit=20` (no `skip_count`) when you do need the total for an "X of Y" UI.
- **Ordering** — `?order=<field>` (server-defined ordering, the field name comes from the endpoint's documented sort columns). Prefix with `-` for descending order: `?order=-create_datetime` returns newest-first.
- **Resource-scoped recomputation** — some reads accept an optional id parameter that triggers server-side recomputation against that resource (e.g. `?basket_id=<id>` on catalogue reads recomputes every price row against the basket's promotions). Pay this cost only when you need the recomputation; skip on broad browsing.

Mutations use `POST` (create), `PUT` (replace), `PATCH` (partial update), `DELETE` (remove). Bodies are JSON, `Content-Type: application/json`. Curl shape sourced from the session module's foundation doc:

```bash
curl -s "$API/oauth/access_token?lang=en" \
  -H "Content-Type: application/json" \
  --data '{"grant_type":"guest"}'
```

### 1.3 Response envelope conventions

Every Upmind response — read or write, success or failure — uses the same outer envelope:

```ts
type EnvelopedResponse<T> = {
  status: "ok" | "error";
  data: T | null;          // payload — shape depends on the endpoint
  error: ApiError | null;  // populated on status: "error" (see section 4)
  messages: string[] | null;
  related: unknown | null; // sometimes carries side-loaded records
  total: number | null;    // populated on list endpoints — total result count
  meta: null;              // envelope-level meta is unused; reserved
};
```

> **Unwrap pattern — `data` for single reads, `{ data, total }` for lists.** A naive transport that returns `body.data` works for every endpoint that returns a single record (`/self`, `/brand/settings`, `/invoices/{id}`) but **loses the pagination cursor** on list endpoints (`/basket/products`, `/invoices`, `/clients/{id}/addresses`). Listing endpoints populate `body.total` with the un-paginated count; without it the caller can't render page counts, "Load more" affordances, or "X of Y" UI.
>
> Two viable transport shapes:
>
> 1. **Two methods** — `request<T>()` unwraps to `data: T` for single reads; `requestList<T>()` returns `{ data: T[], total: number }` for paginated reads. Each feature picks the method that matches the endpoint's response shape.
> 2. **One method, always returning `{ data, total }`** — every caller destructures `data` and ignores `total` when not relevant. Less ergonomic for single reads but simpler.
>
> Either is fine; **choose one and apply consistently.** A mixed transport that silently drops `total` on some calls and keeps it on others is the worst of both worlds. The foundations chapter doesn't prescribe — feature SDDs that consume list endpoints (`SDD 03 catalogue`, `SDD 07 panel`) flag where the pagination cursor matters.

A successful guest-token mint, taken verbatim from the session foundation doc:

```json
{
  "status": "ok",
  "data": {
    "access_token": "mock-access_token",
    "refresh_token": "mock-refresh_token",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_expires_in": 36000,
    "actor_id": "",
    "actor_type": "guest",
    "second_factor_required": false,
    "twofa_provider": null
  }
}
```

Two things to call out about envelopes:

**Envelope-level `meta`** is pagination plumbing the platform reserves; treat it as opaque and ignore it.

**Payload-level `meta`** is something else entirely. Some endpoints (brand, basket, product) return a `meta` field *inside* `data` carrying UI hints the Upmind first-party client uses (translation overrides, layout switches, cart-funnel routing). **The prototype ignores every payload-level `meta` field.** It's not part of the platform contract; it's a UI concession to one specific consumer.

### 1.4 Retry policy

The platform doesn't tell you when to retry — you decide based on what you got back.

| Outcome | Safe to retry? | Notes |
|---|---|---|
| Network failure (no response) | Yes, idempotent reads only | Mutations may have landed server-side. Retrying a non-idempotent POST risks duplicates. |
| `5xx` (transient) | Yes, with backoff | Cap at 2-3 attempts. Surface as an error after the budget runs out. |
| `429 Too Many Requests` | Yes, with backoff | Respect any `Retry-After` if present. |
| `401 Unauthorized` | Only after refreshing the token | See section 2.4 — the auth layer owns this path, not the retry layer. |
| `4xx` validation / business-logic | No | The request is wrong; retrying won't fix it. |
| `403 Forbidden` | No | Authorization decision; retry won't change it. |

`GET`s are idempotent by definition. `PUT` and `DELETE` are idempotent by HTTP contract. `POST` and `PATCH` are not — never blind-retry them without an explicit reason. (`POST /oauth/access_token` is a special case: it's a `POST` that's effectively read-shaped because the body discriminator is what makes the action — but retrying still costs a fresh issuance, so back off carefully.)

### 1.5 Timeouts

The platform has no documented per-endpoint SLO. Pragmatic defaults:

- **Reads**: 15-30 seconds. Brand bootstrap, catalogue reads, the basket itself — all fast in practice.
- **Mutations**: 30-60 seconds. `POST /payments` runs the gateway round-trip on the server side; SCA / 3DS handshakes can take real time.
- **Conversion**: 60-90 seconds. `PATCH /orders/{id}/convert` does the full basket-to-invoice transition plus payment-detail attachment.

A timeout is the caller giving up on a request. The server-side action may still complete — handle that on the next read.

---

## 2. Auth lifecycle

The platform speaks OAuth-shaped bearer tokens. Every request to every endpoint expects an `Authorization: Bearer <token>` header — there is no useful unauthenticated mode. Even "anonymous" browsing requires a *guest* token first.

> **Boundary: foundations vs client-auth.** The **guest-token mint** is a foundations-layer (transport-layer) concern, not a client-auth-feature concern. The foundations layer mints the guest token on app start, persists it, and attaches it to every subsequent request via the auth-header slot. The client-auth feature *promotes* an already-wired guest bearer to a client bearer via password grant / register; it does not bootstrap the bearer. Practically: don't put the guest mint in your "login" or "auth" module — put it next to your HTTP transport, alongside header injection. See SDD 00 step 8 and SDD 01 step 1 for how the workshop implements this split.

### 2.1 Guest vs client tokens

Two kinds of bearer matter to a storefront:

| Token | When you have it | What it authorises | Lifetime |
|---|---|---|---|
| **Guest** | Every visitor, minted on first request via `POST /oauth/access_token` with `grant_type: "guest"` | Brand reads, catalogue reads, basket create / read / mutate, registration | `expires_in: 3600` (1h access); `refresh_expires_in: 36000` (10h refresh) |
| **Client** | After successful login or registration + login | Everything a guest can do, plus `/self`, panel reads, payment-method capture, invoice payment, contract operations | Same window; `actor_type: "client"` |

Both are opaque strings — don't try to introspect them. The platform also issues `reseller`, `user` (staff), and interim `twofa` tokens; the prototype only needs to handle `guest` and `client`. Cross-reference: see [`02-module-foundations/session.md`](./_initiator/generic.md) for the full grant taxonomy.

**Both tokens coexist.** When a guest logs in, the new client token is stored alongside the guest token — *don't* overwrite a single "current token" slot. The guest token is the join key that lets the basket survive the upgrade (see section 2.6).

### 2.2 Token storage trade-offs

Three places you can put a token; each has different trade-offs:

| Storage | Survives reload? | Survives tab close? | Cross-tab visibility | XSS exposure | Cross-origin sharing |
|---|---|---|---|---|---|
| **Memory only** (variable / store) | No | No | No | Low | No |
| **`localStorage`** | Yes | Yes | Yes (via storage event) | High (any JS on the page can read it) | No |
| **`sessionStorage`** | Yes | No | No (per-tab) | High | No |
| **Cookie** (`Secure; HttpOnly; SameSite=Lax`) | Yes | Yes | Yes (per origin) | None (with `HttpOnly`) | Yes (across subdomains if `Domain=` set) |

For a workshop prototype, **cookies on the brand's apex domain** are the closest match to what the Upmind first-party client does — they survive across the cart and panel subdomains and are not readable by random JS on the page. The downside: you need a browser-side helper to set the `Authorization` header from a cookie (browsers don't do it automatically for arbitrary headers).

The pragmatic shortcut for a 2-day prototype: **`localStorage`**, accepting the XSS risk because the prototype isn't going to production. Switch to cookies if/when the prototype graduates.

### 2.3 Header injection

Every authenticated call attaches:

```text
Authorization: Bearer <access_token>
```

The transport layer owns this. Feature code that builds a request never touches the header — it calls `fetch(url, body)` through whatever wrapper you stand up, and the wrapper attaches the bearer from storage.

Two exceptions worth knowing, both owned by the foundations layer (not by any feature):

1. **The guest-token mint itself.** `POST /oauth/access_token` with `grant_type: "guest"` doesn't take an Authorization header; it's the call that *produces* one. The foundations layer fires this on app start — before any feature code has loaded — and persists the result. From then on, the auth-header slot reads from that storage and attaches the bearer to every other call. The transport layer needs an `{ auth: false }` opt-out so the mint call itself can go out cleanly.
2. **The refresh exchange.** `POST /oauth/access_token` with `grant_type: "refresh_token"` similarly doesn't carry the (now-401-ing) access bearer — it carries only the refresh token in the body. Same `{ auth: false }` opt-out; see §2.4.

Some password-recovery endpoints (e.g. magic-link consumption) bootstrap without a bearer too. Out of scope for the workshop prototype, but the opt-out is the same shape.

### 2.4 Token refresh

Tokens carry their lifetime on the wire:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "refresh_expires_in": 36000
}
```

The trigger for refresh is one of:

1. **Proactive** — `expires_in` is about to lapse (e.g. < 60s remaining). Pre-empt the failure.
2. **Reactive** — a request comes back with `401`. The token was thought valid but isn't.

The refresh exchange is itself a `POST /oauth/access_token`:

```bash
curl -s "$API/oauth/access_token?lang=en" \
  -H "Content-Type: application/json" \
  --data '{"grant_type":"refresh_token","refresh_token":"<previous-refresh-token>"}'
```

The response is a fresh `Token` — **with a new `refresh_token`**. Refresh-token rotation is the platform's default: the old refresh token is invalidated by a successful exchange. A caller holding two refresh tokens (two tabs, one refreshed) will see the older one start failing.

**A failed client-token refresh is a hard sign-out signal.** Drop the bearer, prompt for credentials, don't keep retrying.

> **Guest tokens expire too — re-mint, don't sign out.** The refresh path above describes the *client* token lifecycle. The *guest* token has its own `expires_in: 3600` and its own `refresh_token`, but the recovery on expiry differs by intent: there is no user to "sign out", so a failed guest refresh (or a 401 on a request authorised by the guest bearer when the guest token simply lapsed and no refresh token is in storage) should **re-mint a fresh guest** via `POST /oauth/access_token` `{ grant_type: "guest" }` and replay the failed request with the new bearer. The foundations layer's 401-refresh path must branch on the active actor:
>
> - Active actor = `client` → refresh client token; on refresh failure → drop client token, fall back to guest token if still in storage, surface "session expired" to the user.
> - Active actor = `guest` → attempt guest refresh first (if a refresh token is stored); on failure or no refresh token → re-mint a fresh guest (`grant_type: "guest"`, `{ auth: false }`), persist, replay.
>
> Without this branch, a returning visitor whose 1-hour guest token lapsed between sessions sees the storefront 401-storm on first paint with no recovery path. The visitor never logged in — there's nothing to sign them out of — but every read fails until they hard-refresh the page. Re-minting transparently is the only correct behaviour. (See `02-module-foundations/session.md` operation 1 for the guest-mint shape.)

### 2.5 In-flight requests during a refresh

This is the subtle one. A normal storefront has multiple requests in flight at any moment (brand bootstrap + basket read + product list, say). When one of them comes back `401`, the right behaviour is **not**:

- Throw on that request and let the caller deal with it (the caller doesn't know the token was the problem).
- Throw on every in-flight request (now four features are showing errors for one auth issue).
- Refresh and let the in-flight requests keep failing.

The right behaviour:

1. The 401 triggers a refresh.
2. **Hold** every other in-flight request — don't send new ones, don't reject the ones already out.
3. Wait for the refresh to resolve.
4. **Replay** all held requests with the new bearer.
5. **Cancel** any request that was awaiting the old token if the refresh fails (sign the user out).

This is a single shared promise: when a refresh is already in flight, subsequent 401s join the same promise rather than triggering parallel refreshes. Your foundations layer must coalesce — multiple expired requests should not trigger multiple refresh calls.

**Long-running requests can have their token expire mid-flight.** The server validates the token at the moment the request is processed, not when it was sent. A request started just before expiry can fail mid-flight even though both client and server believed the session was valid at send time. The hold+replay handles this transparently for the caller.

### 2.6 Guest → client upgrade preserves the token

When a guest registers or logs in, the basket they built as a guest must survive into their authenticated session. The platform supports this **only if** the same call carries the guest's token context:

- The guest token is what the back end uses to look up the in-flight basket.
- The new client token then owns that basket.

In practice: don't wipe the guest token when issuing the credentials exchange. Once `/self` succeeds with the client token, the basket can be claimed via the basket module's claim operation (see [`02-module-foundations/basket.md`](02-module-foundations/basket.md), capability 2). The session module's foundation doc (lesson "Guest → client is a token swap, not a new session") is explicit about this.

### 2.7 Logout cancels in-flight requests

Logout is a **caller-side** state change. The platform has no logout endpoint — there's no "revoke this token" call. What you do:

1. **Cancel** every in-flight request bound to the old token (use `AbortController`).
2. **Drop** the client token from storage.
3. **Re-mint** a guest token (or keep the previously-held one) so subsequent reads still work.
4. **Invalidate** every cache keyed off the prior actor — basket, panel data, payment methods. The platform doesn't do this for you.

The previous client token remains valid until its natural expiry if the caller forgets to drop it. **Possession of the bearer is access.**

### 2.8 2FA splits the login flow

When the client has 2FA enrolled, `POST /oauth/access_token` with `grant_type: "password"` returns an **interim** token, not a full one:

```json
{
  "actor_type": "twofa",
  "second_factor_required": true,
  "expires_in": 299,
  "access_token": "interim-token",
  "twofa_provider": "Email"
}
```

The interim token authorises *only* the second exchange call — anything else rejects with 401. The second call signs with the interim token and posts the user-supplied code:

```bash
curl -s "$API/oauth/access_token?lang=en" \
  -H "Authorization: Bearer $INTERIM_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"grant_type":"twofa","twofa_code":"123456"}'
```

On success the response is a full client token; from there the flow joins the non-2FA path.

**The interim token has a much shorter expiry** (~5 minutes). A user who reads the email, walks away, and submits the code later sees the same opaque 401 as a wrong code — the platform doesn't distinguish.

For the prototype, the easiest split is: the auth feature owns the 2FA branch as a UI state, and the foundations layer just transports the token. Don't try to model "interim token in flight" as a foundations-level concern; it's a feature flow.

---

## 3. Currency injection

The platform expects every price-aware read and every basket mutation to know what currency it's operating in. The brand module owns the *defaults*; the basket owns the *active* currency; the foundations layer routes whatever the active value is into each request.

### 3.1 Where the brand's currency defaults come from

`GET /brand/settings` returns:

```ts
{
  currency_id: string;         // brand's default currency — UUID (record key)
  currency: {                  // expanded currency object (when ?with=currency)
    id: string;
    code: string;              // "USD", "EUR", "GBP" — preferred for request injection
    prefix?: string;
    suffix?: string;
  };
  currencies: Currency[];      // every currency the brand supports (each has id + code)
}
```

Every currency record carries both a UUID (`currency_id`) and an ISO code (`currency_code`). **Prefer the code for request injection** — endpoints accept `currency_code=USD` without needing to know any UUIDs, and your foundations layer's state stays human-readable.

Cross-reference: [`02-module-foundations/brand.md`](02-module-foundations/brand.md), capability 3 (Read regional defaults) and capability 5 (Validate a currency selection).

The brand response also carries a config key, `ui.basket.default_currency`, with two possible values:

- `"brand"` — use the brand's `currency.code`
- `"language"` — derive from the visitor's locale

For the prototype, treat `ui.basket.default_currency` as `"brand"` and read `brand.currency.code` directly.

### 3.2 How the active currency is selected

The currency that actually applies to a session is a layered choice:

| Source | When it wins | Notes |
|---|---|---|
| Brand default | Initial page load, no basket yet | Read `brand.currency.code` off brand bootstrap. |
| User pick | User explicitly switched on the storefront | Optional capability; out of scope for the BUILT spine. |
| Account currency | Logged-in client | The client's account record carries `currency.code` (with id alongside). If the basket existed pre-login and the user logs in, the basket inherits the account currency on claim. |
| Basket-driven | Once a basket exists | The basket itself carries `currency.code`; once that's set, **the basket is the authority**. |

The simplification for the prototype: at boot, use the brand's `currency.code`. Once the basket exists, use the basket's `currency.code`. If the user logs in mid-session, accept that the basket may switch to the client's account currency on claim (cross-reference: basket foundation doc lessons on claim + account currency inheritance).

### 3.3 How currency reaches each request

Three patterns, each used by different endpoint families:

| Pattern | Where you put the currency | Example |
|---|---|---|
| **Query parameter** | `?currency_code=USD` | `GET /brands/{id}/gateways?currency_code=USD&country_code=GB` |
| **Body field** | `{ currency_code }` | `POST /orders` accepts `currency_code` to seed the basket's currency |
| **Implicit (via basket)** | The basket's currency drives the response | `GET /basket/products/...?basket_id=<id>` — the basket's currency informs every price row |

**Prefer `currency_code` everywhere it's accepted.** The platform also accepts `currency_id` (UUID) as a legacy / alternate form on many endpoints, but the code form is human-readable, easier to log, and doesn't require keeping a UUID lookup table client-side. The foundations layer reads the active `currency.code` from the source-of-truth store and injects it into whichever shape the endpoint wants. Feature code calls `fetch("/brands/.../gateways", { ... })` without thinking about currency; the wrapper appends the right query param or body field.

**Where this matters in the BUILT spine:**

- Brand bootstrap: no currency needed (the response *establishes* the default).
- Catalogue reads: pass currency so prices render in the active currency.
- Basket reads: implicit — the basket carries its own currency.
- Basket mutations: implicit — server uses the basket's currency.
- Payment-gateway eligibility list (`GET /brands/{id}/gateways`): pass `currency_code` as a filter. The platform filters out gateways that don't support the basket's currency.
- `POST /payments`: the invoice carries the currency; no separate param needed.

### 3.4 What happens when currency switches mid-session

Two ways a switch can happen:

1. **User picks a new currency** (optional capability, not in the BUILT spine). Triggers `PATCH /orders/{id}/currency` with `{ currency_code }`. The platform recomputes every line, every discount, every tax. The basket read that follows returns the new totals.
2. **Login causes basket currency to follow account currency** (happens implicitly on claim if the client account is on a different currency).

Either way, the platform does the recomputation; the caller's job is to re-read the basket after the switch and re-render. Any cached price data keyed off the old currency is invalid.

### 3.5 Reads that ignore currency vs reads that need it

| Read | Currency-aware? |
|---|---|
| `GET /brand/settings` | No (it *returns* the currency list, doesn't consume one) |
| `GET /self` | No (account record carries its own currency) |
| `GET /countries`, `/languages`, `/currencies` (system reference data) | No |
| `GET /clients_fields` | No |
| Catalogue browse (`GET /products`, `GET /products/{id}`) | **Yes** — pass `currency_code` for accurate prices |
| Basket read (`GET /orders/current`, `GET /orders/{id}`) | Implicit (basket has its own) |
| Gateway eligibility (`GET /brands/{id}/gateways`) | **Yes** — filters by `currency_code` |
| `POST /payments` | Implicit (invoice has its own) |

Cross-reference for the basket-driven recomputation cost: the **`X-id` parameter recomputation cost** lesson in the basket foundation doc — supplying `basket_id` on a catalogue read makes the back end re-price every row against the basket's promotions. Pay the cost when you need basket-accurate prices (checkout adjacency); skip it on broad browse.

---

## 4. Error model

Every Upmind error rides on the same envelope shape. The job of the foundations layer is to **normalise** that shape into something the UI can render without each feature reinventing the wheel.

> **Three response categories, not two.** Most platforms have "success" (2xx) and "error" (4xx/5xx). Upmind has a third: **soft failure** — a `2xx + status: "ok"` response that nevertheless didn't fully apply what the caller asked for. The platform validates at HTTP level (returns 4xx for hard rejections) but applies a second pass of viability checks after acceptance — for mutations on the basket, options include quantity stepping rules, mandatory-option satisfaction, brand-specific combination rules. A failure in the second pass produces a `2xx` response with the entity stripped from `data` and `warning_notes` populated to explain why. A caller branching solely on HTTP status (or on `status: "ok"`) misses the strip and tells the user something happened when it didn't.
>
> Each module's foundation doc documents its own soft-failure shapes (e.g. basket.md "silent strip", basketProduct.md "Failure modes" on PUT). The cross-cutting rule: every mutation must verify the response carries the entity it submitted; if it doesn't and `warning_notes` is populated, it's a soft failure and the caller must surface the warning to the user rather than treating the mutation as applied.

### 4.1 Standard error response shape

A failed call returns HTTP-level non-2xx, with this body:

```ts
type ApiError = {
  id: string | null;       // correlation id for support; may be null on rate-limits
  type: number;            // ErrorType enum — distinguishes validation / business / system
  code: number;            // HTTP status, repeated inside the body
  message: string;         // human-readable, localised by ?lang
  data: unknown | null;    // field-level validation errors live here for 422s
};
```

Real samples from the session foundation doc:

**401 Unauthorized** — wrong credentials:

```json
{
  "status": "error",
  "data": null,
  "error": {
    "id": "4186cba53c0f819d55c65b949bf33771e53737f2",
    "type": 6,
    "code": 401,
    "message": "The user credentials were incorrect.",
    "data": null
  }
}
```

**429 Too Many Requests** — login rate-limited:

```json
{
  "status": "error",
  "data": null,
  "error": {
    "id": null,
    "type": 0,
    "code": 429,
    "message": "Too many login attempts",
    "data": null
  }
}
```

**422 Unprocessable Entity** — validation failure on `POST /payments` (paraphrased; real shape per the payment foundation doc, `data` carries per-field errors keyed to the provider's `display_fields`):

```json
{
  "status": "error",
  "data": null,
  "error": {
    "id": "...",
    "type": 0,
    "code": 422,
    "message": "Validation failed",
    "data": {
      "card_num": ["Card number is invalid"],
      "card_cvv": ["CVV is required"]
    }
  }
}
```

### 4.2 HTTP status → user-facing category

Map every error into one of these buckets before it reaches the UI. The features then decide how to render each bucket.

| HTTP code | Category | UI behaviour |
|---|---|---|
| `400`, `422` | **Validation** | Show field-level errors inline (use `error.data`). |
| `401` | **Auth** | Trigger refresh + replay (section 2.5). After refresh failure, prompt for credentials. |
| `403` | **Forbidden** | Block the action with a "you don't have permission" message. No retry. |
| `404` | **Not found** | The resource doesn't exist or the actor can't see it. Feature decides. |
| `409`, `412` | **Conflict** | The state changed under you. Re-read and re-render. |
| `429` | **Rate-limited** | Back off; surface a "too many attempts, try again later" message. |
| `5xx` | **System** | Show a generic "something went wrong" with the correlation id. Offer retry on `502`/`503`/`504`. |
| Network failure | **Offline** | Show an offline state; the foundations layer can opt to retry idempotent reads. |

### 4.3 Surfacing field-level validation errors

`422` responses carry `error.data` as a record of `{ field_name: string[] }`. The foundations layer doesn't render these — but it does need to **preserve** them through the normalisation, so the feature code that owns the form can attach the messages to the right inputs.

Important: the field names match the **back end's** field names. For payment, that's the gateway provider's `display_fields` CSV (e.g. `card_num`, `card_cvv`, `card_expire_date`); for registration, that's the custom-field codes from `GET /clients_fields`; for billing details, that's `address_id`, `company_id`, `phone_id`. The form input names need to match for inline error attachment to work.

### 4.4 `AWAITING_CLIENT` / `WAITING` are **NOT errors**

This is the one place the platform's "error vs success" boundary diverges from what an HTTP-shaped retry layer would assume.

**`POST /payments` against an awaiting-client gateway** (bank transfer, offline payment) returns:

```json
{
  "status": "ok",
  "data": {
    "transaction_status": "WAITING",
    "transaction_type": 21,
    "approval_url": null,
    "transaction_id": null
  }
}
```

HTTP `200`. `status: "ok"`. But the transaction hasn't completed — the customer is expected to act outside the app (transfer money, mail a cheque) and the platform recognises the payment hours or days later when the matching incoming transaction is reconciled. The gateway record's `payment_instructions` field carries the markdown copy the user reads.

Cross-reference: [`02-module-foundations/payment.md`](./_initiator/generic.md) — "Awaiting-client gateways are success-shaped but indeterminate". The same module's Operations table shows the three-axis decision the caller makes off `transaction_status × approval_url × gateway.type` — flatten any axis and the consumer will treat a challenge as complete or an awaiting attempt as failed.

**`AWAITING_CLIENT`** also surfaces as an invoice status on the invoice foundation doc: an invoice with an in-flight `WAITING` payment stays `invoice_unpaid` with the payment marked `pending: true` in `payments[]`. It is not paid yet; it is not failed either. Treat it as a third success branch.

The foundations layer's job: **don't categorise `200 + WAITING` as an error**. The feature (payment) reads the body and decides whether it's "complete", "awaiting instructions", or "challenge required".

### 4.5 Retry semantics on transient 5xx

The foundations layer can retry idempotent requests on `502`, `503`, `504` with exponential backoff and a small budget (2-3 attempts, capped at ~5 seconds total). For non-idempotent requests, surface the error and let the feature decide — most flows want to let the user retry deliberately rather than auto-retry a payment.

### 4.6 What the foundations layer normalises into "AppError"

The features shouldn't see the raw envelope. They should see something like:

```ts
type AppError = {
  category: "validation" | "auth" | "forbidden" | "not_found" |
            "conflict" | "rate_limited" | "system" | "offline";
  status: number;            // HTTP code
  message: string;           // from error.message
  fieldErrors?: Record<string, string[]>; // from error.data on 422
  correlationId?: string;    // from error.id, for support / logging
  retryable: boolean;        // foundations layer's decision
};
```

Concerns the foundations layer owns (the shape itself is your call):

- Categorisation from HTTP status + envelope.
- Field-error extraction for `422`.
- Correlation id capture.
- Marking whether the request is retryable.
- Distinguishing between a network failure (no response at all), a CORS rejection (response shape may differ — the dev-server reverse proxy / hosts setup catches most of these — see initiator section 4), and a real platform error.

What features still own:

- Whether to render a toast, a modal, a banner, an inline field error.
- Whether to log the user out on certain auth failures (most should defer to the foundations layer's refresh path).
- Domain-specific reactions to `WAITING` / `AWAITING_CLIENT`.
- Verifying that mutations actually applied (see §4.7 — soft-failure detection is per-feature; the foundations layer can't generalise it).

### 4.7 Soft-failure detection (`2xx` + entity-stripped + `warning_notes`)

The third response category. Not normalised into `AppError` because, at HTTP level, it isn't an error — it's a success the caller has to verify content of.

**Shape:**

```jsonc
// Caller did: POST /orders/{basketId}/products with { product_id: "X", quantity: 1 }
{
  "status": "ok",
  "data": {
    "id": "basket-id",
    "products": [
      // product X is ABSENT — caller's submission was silently stripped
    ],
    "warning_notes": [
      {
        "id": "warning-id",
        "message": "Logo Design requires quantity in multiples of 2; submitted quantity of 1 was not added.",
        "is_hidden": false,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  },
  "error": null
}
```

**Triggers** (non-exhaustive, vary per endpoint — see each module's foundation doc):

- Quantity doesn't satisfy the catalogue product's `unit_quantity` stepping
- Mandatory option not satisfied (e.g. a configured product seated without picking a required plan tier)
- Brand-specific combination rules (e.g. "this product can't be in the same basket as that one")
- Promotion stacking rules disagreed with the codes the caller submitted

**Detection pattern (caller-side):**

```text
1. Snapshot the pre-call entity state (e.g. basket.products[] before POST).
2. Issue the mutation.
3. On 2xx + status: ok, diff the post-call entity against the snapshot.
4. If the thing you submitted is absent AND data.warning_notes is non-empty,
   you hit the silent-strip path. Surface the warning_notes[].message to the
   user as a soft error; do NOT treat the call as applied.
5. If the thing you submitted is present, the call applied as expected
   (warning_notes may still be populated as advisories — see basket.md).
```

**Where soft failure applies** (the set of endpoints to defend on most carefully):

- `POST /orders/{basketId}/products` (seat) — `basketProduct.md` Failure modes
- `PUT /orders/{basketId}/products/{basketProductId}` (update) — `basketProduct.md` Failure modes
- `PUT /orders/{basketId}` with `products` body (bulk replace) — same
- `POST /orders/{basketId}/promotions` (apply promotion) — promotion may be silently rejected as un-stackable
- Less common but worth defending on: any mutation that returns a refreshed parent envelope rather than just an OK/error scalar

The foundations layer can't generalise this — it doesn't know which entity in `data` the caller cares about. Soft-failure detection is the caller's job; the foundations layer's job is to make sure the raw `warning_notes` (and `notes`, and `messages`) survive the response unwrap without being silently dropped.

---

## 5. How a feature consumes the foundations layer

The contract a feature gets from the foundations layer is, more or less:

> **"Call `fetch(url, opts)` through me. I'll attach the bearer, inject the currency, normalise the error, and refresh-and-replay on 401. You handle the response data."**

Concretely, every feature's service / loader / fetcher looks like:

```ts
// pseudo-code — your stack will name things differently
async function loadInvoice(invoiceId: string) {
  const response = await api.get(`/invoices/${invoiceId}`, {
    query: { with: "brand,taxes,client,gateway,products,promotions" }
  });
  return response.data;
}
```

The feature doesn't:

- Read the bearer from storage.
- Attach `Authorization`.
- Pick the active currency.
- Decide whether `401` means "refresh" or "log out".
- Map a `422` body into form errors.

The feature does:

- Know what endpoint to call and what `with=` expands it needs.
- Know what to do with the response data (render it, store it, hand it to another feature).
- Decide what to do with an `AppError` it didn't expect (usually: surface a generic error and let the user retry).

When you find a feature that's reaching past the foundations layer to do auth or currency itself, that's a sign the foundations layer is missing a capability — fix the layer, not the feature.

---

## 6. Foundations layer — validation checklist

Before you move on to feature 1 (auth), the foundations layer should pass every item below. Each is testable; each catches a real failure mode the spine will hit.

- [ ] **Path prefix routing — two prefixes, applied per request by the transport.** Inspect the network panel and verify both shapes appear correctly:
  - **OAuth grants:** `POST ${api_base}/oauth/access_token` — **no `/api/` prefix**. Test with the guest-mint call.
  - **Everything else:** `${api_base}/api/<logical-path>` — `/api/` prepended. Test with the `/countries` smoke read.
  - Feature code passes logical paths (`/oauth/access_token`, `/countries`) without either prefix; the transport selects the right one based on the leading segment. If the guest mint goes to `/api/oauth/...` (wrong) or the `/countries` read goes to `/countries` (wrong, no `/api/`), the transport is broken — fix it before continuing.
- [ ] **Guest token minted on startup.** On first paint (before any feature code runs) the foundations layer fires `POST /oauth/access_token` `{ grant_type: "guest" }` with `{ auth: false }` and persists the response. No feature has to remember to do this.
- [ ] **Public read works.** A fresh page can `GET /countries?lang=en` or `GET /brand/settings` and the request automatically carries `Authorization: Bearer <guest.access_token>` — the foundations layer attaches it without the feature code asking.
- [ ] **Authenticated read works.** With a client token, `GET /self?with=actor,accounts` returns the client record and the account list.
- [ ] **Currency reaches the right calls.** Brand bootstrap returns a currency; the basket-aware catalogue read includes `currency_code` (or `basket_id`) and prices come back in the active currency.
- [ ] **401 triggers refresh + replay.** Forge an expired token, fire a read, observe the foundations layer refreshes once and the original read succeeds with the new bearer. **Only one refresh request fires** even if several reads land 401 simultaneously.
- [ ] **Refresh failure logs out.** Forge an unusable refresh token, fire a read, observe the layer clears the client token, surfaces a sign-in prompt, and does **not** keep retrying.
- [ ] **Logout cancels in-flight requests.** Fire a slow read, log out before it resolves, observe the request is aborted and the user is back in guest state.
- [ ] **Validation errors are field-keyed.** Submit a deliberately invalid registration payload; the foundations layer surfaces `error.data` field by field so the form can render inline errors.
- [ ] **`200 + WAITING` is not an error.** Mock or capture a payment response with `transaction_status: "WAITING"`; the foundations layer returns success and the payment feature reads the body to decide what to do.
- [ ] **`warning_notes`, `notes`, and `messages` survive response unwrap.** A `2xx + status: "ok"` response with `data.warning_notes: [...]` populated reaches feature code intact — the foundations layer does NOT silently drop these fields when unwrapping the envelope. Soft-failure detection (§4.7) depends on it. Test by inducing a silent-strip on a basket seat with a wrong quantity and verifying the feature sees the warning_notes array.
- [ ] **5xx is retried, 4xx is not.** A flaky `503` against a `GET` retries 2-3 times then surfaces; a `422` surfaces immediately.
- [ ] **Bearer attached to every authenticated request.** Network inspector shows `Authorization: Bearer ...` on every call except the explicit no-auth opt-outs (guest mint, refresh).
- [ ] **The basket's currency drives the basket-aware read.** Once a basket exists, the catalogue read for adding more products comes back priced in the basket's currency, even if the user switched currency mid-session.

When all fourteen pass, the layer is solid enough to build features 1-7 on top of. When they don't, fix the foundations layer rather than working around it in the feature.

---

## Cross-references

> Links below are **bundle-relative**. They resolve when you read this file from the handover bundle (`workshop-bundle/03-foundations-chapter.md`).

- [Workshop initiator (generic)](06-initiator/generic.md) — section 4 (staging environment + local DNS), section 6 (architecture decisions)
- [Session foundation doc](02-module-foundations/session.md) — auth lifecycle, token shape, 2FA, transfer
- [Client foundation doc](02-module-foundations/client.md) — customer profile + sub-records
- [Brand foundation doc](02-module-foundations/brand.md) — currency defaults, brand bootstrap, host-header resolution
- [System foundation doc](02-module-foundations/system.md) — reference data including the full currency list
- [Basket foundation doc](02-module-foundations/basket.md) — basket-driven currency, the `basket_id` recomputation cost
- [Payment foundation doc](02-module-foundations/payment.md) — error states, `WAITING`, 3DS challenge
- [Invoices foundation doc](02-module-foundations/invoices.md) — invoice lifecycle, `AWAITING_CLIENT` payments
