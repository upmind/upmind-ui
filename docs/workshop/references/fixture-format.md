# Fixture format — v2 spec

> Defines the on-disk shape of `tests/__fixtures__/recordings/*.json` and equivalent files in the handover bundle at `07-references/recordings/`.
>
> **v2 (current target)** adds `request.body` and `request.headers` so callers can verify their request shape against the captured truth, not just their response shape. v1 captured response-only and produced a documented failure mode where agents had to infer request shapes from prose docs that were sometimes incomplete.

---

## Why v2 exists

A workshop agent surfaced concrete examples of v1's failure mode:

> *"Fixtures exist but they're response captures, not request captures. I never read them. But even if I had — those are RESPONSE captures. The request body that produced them isn't in the bundle."*

The headless code carries BE flags (e.g. `provision_field_values_validate`) the foundation docs sometimes omit. Without a captured request body, the agent has no way to cross-check the doc against reality — both sides could be wrong and they'd never know.

v2 closes that loop: the request body is captured alongside the response, and consumers can diff documented `RequestBody` types against the actual wire payload that produced the captured response.

---

## File shape

```jsonc
{
  "version": 2,
  "request": {
    "method": "POST",                  // HTTP verb
    "path": "/api/clients/register?lang=en-US",  // path INCLUDING /api/ prefix and any query string
    "headers": {                        // headers the caller sent (redacted — see redaction rules)
      "Content-Type": "application/json",
      "Authorization": "Bearer <REDACTED>"
    },
    "body": {                           // the JSON request body (null for GET / DELETE without body)
      "email": "new@example.com",
      "username": "new@example.com",
      "password": "<REDACTED>",
      "firstname": "Pat",
      "lastname": "Doe"
    }
  },
  "response": {
    "status": 200,
    "headers": {                        // OPTIONAL — only when a header is part of the contract (e.g. Set-Cookie, Location)
      "X-Request-Id": "..."
    },
    "body": {
      "status": "ok",
      "data": { "id": "085e69d5-...", "public_name": "Pat D.", "org_id": "...", "image_url": null },
      "related": null,
      "total": null,
      "error": null,
      "messages": [],
      "meta": null
    }
  },
  "captured_at": "2026-05-17T14:23:11Z",  // ISO 8601 — when the capture was taken
  "brand_domain": "contabo-workshop.upmind.app", // the brand the capture ran against
  "notes": "Brand has recaptcha disabled; request body omits recaptcha_token."  // OPTIONAL — anything non-obvious about how this capture was produced
}
```

### v1 → v2 migration

v1 fixtures (response-only) look like:

```json
{
  "request": { "method": "POST", "path": "/api/clients/register?lang=en-US" },
  "response": { "status": 200, "body": { ... } }
}
```

A v1 fixture is still readable by a v2 consumer: missing fields (`version`, `request.headers`, `request.body`, `captured_at`, `brand_domain`, `notes`) are tolerated as `undefined`. **v2 captures must include `request.body` for POST / PUT / PATCH**; otherwise the upgrade has no value.

Tooling should default `version: 1` when the field is absent.

---

## Redaction rules

The recording proxy / capture harness MUST redact the following before writing the file:

| Field | Strategy |
| --- | --- |
| `Authorization` header (any value) | Replace value with `"Bearer <REDACTED>"` |
| `Cookie` header (any value) | Replace value with `"<REDACTED>"` |
| `Set-Cookie` response header | Strip entirely — never capture |
| Request body `password` field | Replace value with `"<REDACTED>"` |
| Request body `recaptcha_token` field | Replace value with `"<REDACTED>"` |
| Request body `refresh_token` / `access_token` field | Replace value with `"<REDACTED>"` |
| Response body `access_token` / `refresh_token` fields | Replace value with deterministic placeholder (e.g. `"<REDACTED_ACCESS_TOKEN>"`) so the type shape is preserved but the value is non-recoverable |
| Real client PII (email addresses on real accounts) | Replace with synthetic placeholder (`new@example.com`, `pat@example.com`) |
| Real card numbers / PAN | Never capture — only Stripe test cards are valid captures |

Fixtures are checked into the public-facing monorepo and shipped in the customer bundle. Anything that hits the disk must be safe to publish.

---

## What MUST be captured

Per HTTP verb:

| Verb | `request.body` | `request.headers` | Notes |
| --- | --- | --- | --- |
| GET | `null` | required (auth header redacted) | Path may carry query string — that's where the input lives |
| POST | required | required (auth header redacted) | The canonical request shape consumers verify against |
| PUT | required | required (auth header redacted) | Same — show the full replacement body |
| PATCH | required | required (auth header redacted) | Show the partial-update body shape |
| DELETE | usually `null`; required if the endpoint accepts a body | required (auth header redacted) | Rare but exists |

---

## Fixture naming

Unchanged from v1 conventions documented in [`fixture-index.md`](./fixture-index.md):

- `{method}-{path-with-dashes}-{hash?}.json`
- Double-dash after method (`post--oauth-...`) for top-level endpoints with no path-id between method and resource
- Hash suffix when multiple captures of the same endpoint cover different inputs (different query params, different request bodies)

When a v2 capture supersedes a v1 capture for the same endpoint+input, **overwrite** the existing file — don't keep both. v1 is strictly inferior; preserving it confuses readers about which is authoritative.

---

## How to capture a v2 fixture

These steps assume the existing recording proxy (referenced in [`fixture-index.md`](./fixture-index.md) "Capturing new fixtures") can be extended to record request bodies. If the existing harness can't, replace it with `mitmproxy` / `caddy` / `nginx` in capture mode, or use `curl --trace-ascii` to produce HAR-style output and a small script to convert HAR → fixture JSON.

1. **Start the recording proxy** pointed at the staging brand.
2. **Make the request** through the proxy — either via the existing client UI, via curl with realistic values, or via a test harness that exercises the endpoint deterministically.
3. **Verify the captured file** has `version: 2` and `request.body` populated for non-GET verbs.
4. **Apply redaction rules** above. The harness should do this automatically; if you're hand-capturing, run a redaction pass before commit.
5. **Save** as `tests/__fixtures__/recordings/{method}-{path-with-dashes}-{hash}.json`.
6. **Update [`fixture-index.md`](./fixture-index.md)** with the new fixture's purpose.
7. **Re-build the workshop bundle** if a v2 fixture replaces a v1 fixture that already shipped: `./docs/workshop/build-bundle.sh && tar -czf contabo-workshop.tar.gz contabo-workshop`.

---

## How to consume a v2 fixture

When reading a fixture as part of building a feature:

1. **Check `version`.** If `1`, the request body is not captured — fall back to the documented `RequestBody` type in the relevant module foundation doc and flag the gap.
2. **For mutation endpoints**: compare your in-progress request payload against the captured `request.body` field-by-field. Differences are either:
   - Bugs in your code (the captured request worked; yours doesn't)
   - Doc gaps (the captured request carries a field the doc didn't mention — e.g. `provision_field_values_validate`)
3. **For all endpoints**: use `response.body` to derive types and edge cases, exactly as v1 prescribed.

If a v2 fixture's request shape disagrees with the foundation doc's documented `RequestBody` type, **the fixture wins** and the doc gets updated. Captured-from-staging is the ground truth.

---

## Validation

Before committing a new fixture, verify:

- [ ] `version: 2` set
- [ ] `request.path` includes `/api/` prefix and any query string
- [ ] `request.body` populated for POST / PUT / PATCH (or explicitly `null` for body-less mutations)
- [ ] Redaction rules applied to every field that requires it
- [ ] `captured_at` is a valid ISO 8601 timestamp
- [ ] `brand_domain` matches the brand the capture ran against
- [ ] No real PII (emails, names, card numbers) outside the documented synthetic placeholders
- [ ] Fixture is referenced in [`fixture-index.md`](./fixture-index.md)
- [ ] The captured response was a success the caller would want to reproduce — failed/error captures live under explicit `-error-*.json` filenames per the v1 convention
