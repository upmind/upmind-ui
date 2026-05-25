# SDD 00 — Project scaffold

## Goal

At the end of this feature the team has an empty project initialised in their chosen stack, running locally at `https://<brand_domain>` with a trusted TLS cert, and a thin foundations layer that can issue a single `GET /countries` against the staging Upmind API and render the count on a smoke-test screen. No business features, no auth flow, no brand bootstrap — just plumbing the rest of the spine plugs into.

## Depends on

None — this is the entry point.

## Modules consumed

- `session` — see [02-module-foundations/session.md](../02-module-foundations/session.md). This feature uses **only** operation 1 (guest-token mint via `POST /oauth/access_token` with `grant_type: "guest"`) to wire the foundations layer's auth-header slot. All other session capabilities (password grant, register, refresh, logout, identity) belong to feature 1.
- This feature **is** the foundations layer. The contract it satisfies is `03-foundations-chapter.md`.

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 4 (Staging environment + local DNS), 5 (Team profile), 6 (Architecture decisions), 8 (Feature sequence), 10 (Agent instructions, especially operating principles 1, 3, 4, 6)
- `03-foundations-chapter.md` — full chapter, all six sections
- `02-module-foundations/session.md` — operation 1 only (guest mint). Skip the password/register/refresh/logout sections; those are feature 1's territory.

## What this feature does

1. Confirm sections 4, 5, and 6 of `06-initiator/generic.md` are filled in from the Kickoff Interview. If any cluster is blank, stop and run the relevant cluster from initiator section 10. Do **not** scaffold against guesses.
2. Add `127.0.0.1   <brand_domain>` to the OS hosts file. Walk the team through the edit — they run the sudo / Administrator step, not you. Flush DNS per the platform commands in initiator section 4.
3. Generate a locally-trusted TLS cert for `<brand_domain>` using the team's chosen approach from cluster 1 (mkcert if no preference). Run `mkcert -install` once so the OS trust store accepts it.
4. **Verify current-latest versions before installing.** For each load-bearing package the team picked in cluster 2 (framework, build tool, styling, UI kit), check the actual current major against the npm registry (`npm view <pkg> version`) or the package's own site. Your training cutoff lags reality — don't default to your remembered version. Confirm the picked majors with the team if any are older than current-latest, and record the locked versions in section 5 of `06-initiator/generic.md` so they survive `/clear`. **Especially watch:** Tailwind (v3 → v4 changes config shape + plugin loading; shadcn's CLI has different variants per Tailwind major), framework majors, Next.js, Vite.
5. Initialise the project in the team's framework + build tool + package manager (initiator section 5). Use the framework's own scaffolder (`pnpm create vite`, `npm create svelte@latest`, etc.) — don't hand-roll. Pin to the majors confirmed in the previous step.
6. Configure the dev server to bind to `<brand_domain>` on `<local_port>`. **Protocol depends on the brand's `oauth_clients` registration:**
   - If the brand has the `https://<brand_domain>:<port>` form registered (typical for staging brands), use HTTPS with the cert from step 3. Feed the dev server `https.cert` + `https.key` (Vite / Next / SvelteKit all accept these).
   - If the brand has `http://<brand_domain>:<port>` registered (common when the team picked a high alt port like 5173 and skipped local TLS), use plain HTTP. **Skip step 3 entirely** in this case — no cert needed. The brand domain still must resolve via `/etc/hosts`; only the protocol differs.
   - Either is valid platform-side. Cluster 1 of the Kickoff Interview asks the team's TLS preference; if they picked "no TLS, alt port" the brand admin must have a matching `http://...` registered or every request will fail CORS-side. Confirm with the team or by inspecting `brand.oauth_clients` in the bootstrap response.
7. Implement the foundations layer per `03-foundations-chapter.md`, in the shape the team chose in cluster 4:
   - **HTTP transport** — base URL = `<api_base>` (host only, no trailing path). **Apply the right path prefix per request — two prefixes, not one:**
     - `/oauth/*` paths (every OAuth grant — guest mint, password, refresh, twofa, auth_code) go to `${api_base}/oauth/<path>` — **no `/api/` prefix**.
     - **Every other path** (`/countries`, `/clients/register`, `/brand/settings`, `/orders`, `/payments`, etc.) goes to `${api_base}/api/<path>` — `/api/` is prepended.
     - Feature code passes logical paths (no prefix); transport reads the leading segment and selects. JSON envelope handling, idempotent-only retry on `5xx` / network failures (2-3 attempts, backoff capped at ~5s), default timeouts (30s reads, 60s mutations).
     - See `03-foundations-chapter.md` §1.1 — getting either prefix wrong is the most common day-0 failure mode and returns `404` on the matching path family. Test both shapes before moving on.
   - **Auth header slot** — every request attaches `Authorization: Bearer <token>` if a token exists in the chosen storage (cluster 4, q26). Provide an `{ auth: false }` opt-out for the guest-mint call (step 8 below) and the refresh call feature 1 will wire later. The 401-refresh path itself is stubbed but not implemented here — feature 1 fills it in.
   - **Currency slot** — every price-aware call reads the active currency from a single source-of-truth store (cluster 4, q27) and injects it as the endpoint expects (query param / body field). Store is empty for now.
   - **Error normalisation** — non-2xx responses (and `200 + status: "error"` envelopes) map to the `AppError` shape (section "Data shapes" below). `200 + status: "ok"` with payload-level `transaction_status: "WAITING"` is **not** an error — pass it through untouched.
8. **Guest-token bootstrap.** On app start (before any other API call), call `POST /oauth/access_token` with `{ grant_type: "guest" }` using the foundations layer's `{ auth: false }` opt-out (no Authorization header on the mint call itself). Persist the returned `Token` in the storage chosen in cluster 4. From this point onward, the auth-header slot reads from that storage and attaches `Authorization: Bearer <guest.access_token>` to every subsequent request. **Why this lives in foundations and not in feature 1:** every Upmind endpoint — even the "public" ones like `/countries` — requires a bearer. Guest-mint is a transport-layer concern, not a user-facing auth concern. Feature 1 (auth) layers client-auth (register / login / refresh) on top of an already-wired guest bearer; it does not own the mint itself.
9. Add a single smoke-test screen / route that calls the foundations layer for `GET /countries?lang=en` and renders the count (e.g. "247 countries loaded"). The guest bearer from step 8 attaches automatically — this is the wire-up check. No styling required.
10. Induce a deliberate 4xx (e.g. fetch `/this-does-not-exist`) and confirm the AppError surfaces with a category and message, not a raw `Response`.
11. Walk the team through every item in the Validation checklist below. Commit on green.

## Data shapes (feature-scoped)

```ts
// The platform's envelope — every response, every endpoint
type EnvelopedResponse<T> = {
  status: "ok" | "error";
  data: T | null;
  error: ApiError | null;
  messages: string[] | null;
  related: unknown | null;
  total: number | null;
  meta: null;
};

// Raw error shape from the platform (before normalisation)
type ApiError = {
  id: string | null;
  type: number;
  code: number;
  message: string;
  data: unknown | null;
};

// What the foundations layer hands to features
type AppError = {
  category:
    | "validation" | "auth" | "forbidden" | "not_found"
    | "conflict" | "rate_limited" | "system" | "offline";
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
  correlationId?: string;
  retryable: boolean;
};

// Foundations layer config (read once at startup)
type FoundationsConfig = {
  apiBase: string;        // e.g. https://api.upmind.io
  brandDomain: string;    // e.g. contabo-workshop.upmind.app — informational
  defaultLang: string;    // "en" for the prototype
  timeouts: { read: number; mutation: number; conversion: number };
};

// The single function (or method) every feature calls
type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  auth?: boolean;         // default true; false for guest-mint + refresh
  signal?: AbortSignal;
};

// request(method, path, opts) -> Promise<T>  // T = unwrapped data; throws AppError
```

## API calls

| Step | Method | Endpoint | Purpose | Notes |
| --- | --- | --- | --- | --- |
| 8 | POST | `/oauth/access_token` `{ grant_type: "guest" }` | Mint the guest bearer that every subsequent call attaches. Sent with `{ auth: false }` (no Authorization header). | `07-references/recordings/post--oauth-access_token-guest.json` |
| 9 | GET | `/countries?lang=en` | Smoke test — confirms transport + envelope unwrap + auth slot (now wired with guest bearer) + error path. | `07-references/recordings/get-countries.json` (if present; otherwise live staging is source of truth). |
| 10 | GET | `/this-does-not-exist` | Induced 404 — confirms AppError normalisation surfaces as `category: "not_found"` not a raw `Response` | Throwaway; remove once the team has seen it work. |

## Edge cases

- **`/etc/hosts` edit needs sudo.** Walk the team through the edit; do not run sudo yourself. On Windows, the file is `C:\Windows\System32\drivers\etc\hosts` and the editor must be launched as Administrator.
- **Browser shows cert warnings.** The `mkcert -install` step was skipped or run under a different user. Re-run it, restart the browser.
- **`ping <brand_domain>` does not resolve to 127.0.0.1.** DNS cache wasn't flushed. Run the platform-specific flush command from initiator section 4.
- **CORS errors on first request.** Almost always a wrong-host issue — the browser tab is on `localhost` instead of `<brand_domain>`. Cross-ref initiator section 4 and the foundations chapter section 1.1.
- **`GET /countries` returns brand defaults that look "wrong".** The platform resolves brand from the host header — confirm the browser is on `<brand_domain>` and the dev server is forwarding the host correctly.
- **Long timeout on countries.** Staging is occasionally slow; the 30s read timeout is fine. Don't shorten it.
- **Payload-level `meta` in responses.** Ignore it. It's a UI concession to the first-party client, not part of the contract (foundations chapter section 1.3).
- **Foundations layer wants to know about tokens.** It doesn't yet. Feature 1 owns the token lifecycle; the layer just has a slot.

## Validation checklist

- [ ] `<brand_domain>` resolves to `127.0.0.1` (verify with `ping <brand_domain>` or `dig <brand_domain>`).
- [ ] Dev server listens on `https://<brand_domain>:<local_port>`; the browser loads it with a valid lock icon and no cert warnings.
- [ ] The project is initialised in the team's chosen framework + build tool, using the team's package manager from initiator section 5.
- [ ] The foundations layer exposes a single `request(method, path, options)` function (or the equivalent shape per cluster 4) that handles transport + auth header slot + currency slot + error normalisation. Features cannot reach `fetch` directly.
- [ ] **Path prefix routing — two prefixes, applied per request.** Verify both shapes in the network panel:
  - Guest-mint call: `POST ${api_base}/oauth/access_token` — **no `/api/`** segment in the URL.
  - Smoke-test call: `GET ${api_base}/api/countries?lang=en` — `/api/` prepended.
  - Feature code passes `/oauth/access_token` and `/countries` without prefixes; transport applies them. If either is wrong, fix before continuing.
- [ ] On app start, the foundations layer mints a guest token via `POST /oauth/access_token` `{ grant_type: "guest" }`. The mint call goes out with `{ auth: false }` (no Authorization header); the response is persisted in the storage chosen in cluster 4.
- [ ] Every subsequent request carries `Authorization: Bearer <guest.access_token>` automatically via the auth-header slot. Verify in the network panel.
- [ ] The currency slot is wired but empty — currency-aware calls accept a currency arg but the store returns `null` for now.
- [ ] The smoke-test screen successfully calls `GET /countries?lang=en` against `<api_base>` (carrying the guest bearer) and renders the count (e.g. "247 countries loaded").
- [ ] An induced 4xx (fetch `/this-does-not-exist`) is surfaced through `AppError` with `category: "not_found"`, not as a raw `Response` or thrown `Error`.
- [ ] `200 + status: "error"` envelopes are categorised as errors (test by mocking, or accept as a deferred check until feature 1 produces a real one).
- [ ] No code from `packages/headless`, `packages/ui`, or `packages/client-vue` of the Upmind monorepo is imported (initiator section 10, "What you do not do").
- [ ] Repo committed at a clean point so feature 1 builds on a green baseline.

## Notes for the agent

- **Path-prefix routing is the most common day-0 failure mode — and there are TWO prefixes, not one.** `/oauth/*` paths sit at host root (no `/api/`); everything else sits under `/api/`. Concrete: guest mint → `${api_base}/oauth/access_token`. Countries read → `${api_base}/api/countries`. Both prefixes are applied by the transport based on the path's leading segment; feature code never includes either. See foundations §1.1. If the guest mint 404s, the transport is over-prefixing OAuth paths; if `/countries` 404s, it's missing `/api/` for non-OAuth paths.
- This feature does **not** implement client auth (register / login / refresh / logout / identity), brand-bootstrap, currency selection, or any business logic. Those are features 1–7. **It does** wire the guest-token mint — that's a transport-layer concern, not a feature-1 concern, because every Upmind endpoint requires a bearer.
- The auth-header slot is **wired with a real guest bearer** at the end of this feature. Feature 1 (client auth) adds the client token alongside the guest token (both coexist in storage per session.md's "guest + client coexist" lesson), wires the refresh-on-401 path that this feature only stubbed, and implements logout.
- The currency slot is empty today — feature 2 wires in the brand default; feature 4 switches it to basket-driven.
- The team's stack and architecture choices live in initiator sections 5 + 6 (filled from the Kickoff Interview). Read them before deciding *how* to scaffold; don't re-litigate them.
- Foundations chapter section 6 lists eleven validation items the layer eventually needs to pass. This feature only delivers the subset listed above — the rest (refresh + replay, logout cancellation, field-keyed validation errors, `WAITING` pass-through under load) get exercised by features 1, 5, and 6. That's expected; don't try to test them here.
- If the team asks "where does the token storage live?" — that's a cluster 4 question (q26). If unanswered, capture it now before writing storage code.
- Commit at the end so feature 1 starts from a green baseline.
