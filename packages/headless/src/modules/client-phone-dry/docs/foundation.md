# Module: client-phone-dry

> This doc describes the client-phone-numbers capability as this module's code and test fixtures capture it. A second implementation of the same capability (`client-phone`) exists in this codebase and is the one other modules currently depend on; this module is a parallel build used to validate a build process and is not itself consumed anywhere yet. That distinction is codebase-internal and does not change the platform capability described below.

## What it is

A client account holds zero or more phone numbers, one of which may be marked default. The platform lets the account holder manage their own list, and lets a staff member manage a _named_ client's list on their behalf through a separate, admin-scoped path. Every phone number carries a category (mobile / home / office / personal), a verification flag, a delete-eligibility flag, and a staged-import flag for rows still pending reconciliation from a bulk import.

## Core concepts

- **Access path** — the same list/create/update/delete/set-default capability is reached one of two ways: the account holder's own path, or a staff member's admin path naming the target client. Both paths return and accept the same phone shape; only the URL namespace and the acting identity differ.
- **Default phone** — exactly one phone in a list may be flagged default at a time; setting a new default is a variant of the update operation, not a separate resource.
- **Type** — a required category code on every phone (mobile / home / office / personal). The platform rejects a write missing it.
- **Staged import** — a phone that arrived through a bulk import and has not yet been reconciled. It appears in ordinary list reads but its edit/delete/set-default operations are locked until reconciliation happens through the import flow (not through this capability).
- **Capability code** — a staff member's permission to create, update, list, or delete a client's phone is expressed as one of four named codes (`list_client_phones`, `create_client_phone`, `update_client_phone`, `delete_client_phone`) carried on the staff user's own profile, not on the phone resource.

## Operations

| #   | Capability       | Inputs                                                      | Outputs                                                                                                   |
| --- | ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | **List phones**  | actor's own identity, or a named target client (admin path) | array of phone records, including staged-import rows                                                      |
| 2   | **Create phone** | phone number, category (`type`)                             | the created phone record                                                                                  |
| 3   | **Update phone** | phone id, phone number and/or category                      | the updated phone record                                                                                  |
| 4   | **Delete phone** | phone id                                                    | success; blocked when the record's own delete-eligibility flag is false, or the record is a staged import |
| 5   | **Set default**  | phone id                                                    | the updated phone record, now flagged default                                                             |

- **Cover every observable behaviour**: readiness/refresh/invalidate exist as always-on lifecycle behaviours around capability 1, not separate BE calls — see Lessons.
- Capabilities 2–5, reached via the admin path, require the acting staff profile to carry the matching capability code (`create_client_phone` for 2, `update_client_phone` for 3 and 5, `delete_client_phone` for 4, `list_client_phones` for 1's refresh). A staff profile missing a code cannot perform that capability via the admin path at all.
- A staged-import row rejects capabilities 3, 4, and 5 regardless of actor or capability code, until reconciled outside this capability.

## Data shape

Source of truth is the fixture the platform returns, not just the typed contract — every fixture field below appears whether or not a narrower client type happens to read it.

```typescript
// A phone record, as returned by both the self and admin list/mutation endpoints
type Phone = {
  id: string;
  client_id: string;
  user_id: string;
  phone: string | null; // full E.164-ish number as stored
  phone_code: string; // calling code, e.g. "1"
  phone_country_code: string; // ISO country, e.g. "US"
  full_phone: string; // platform-formatted display string
  international_phone: string; // platform-formatted international display string
  type: number | null; // category code (1 mobile / 2 home / 3 office / 4 personal)
  default: number | null; // truthy = this is the account's default phone
  verified: number; // truthy = this number has been verified
  can_delete: boolean; // false = deletion is blocked for this record
  staged_import: boolean; // true = arrived via bulk import, not yet reconciled; edit/delete/set-default locked
  import_id: string | null; // the import batch this record came from, when staged
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// Request body for create/update (both self and admin paths)
type PhoneWriteBody = {
  phone: string; // national number
  phone_code: string; // calling code with leading "+", e.g. "+1"
  phone_country_code: string; // ISO country, e.g. "US"
  type: number; // required — category code
};

// Request body for the set-default variant of update
type SetDefaultBody = {
  default: true;
};
```

Envelope wrapping every list/mutation response:

```typescript
type Envelope<T> = {
  status: "ok" | "error";
  data: T | null;
  related: unknown | null;
  total: number | null;
  error: null | {
    id: string;
    type: number;
    code: number;
    message: string;
    data: Record<string, string[]> | null;
  };
  messages: string[] | null;
};
```

## Dependencies

### Dependants — modules that read from this one

None. This is a net-new capability build with no consumer anywhere in the codebase today.

### This module's own dependencies

- **HTTP transport layer** — bearer-token attachment, currency injection, error-shape normalisation.
- **Actor/session identity** — the acting identity (the account holder's own session, or a staff member's own session when acting on a named client) supplies the bearer token for every call; the target client id is supplied by the caller for the admin path, never inferred from a token.
- **Country/locale data** — used to seed and format a new phone's country when no explicit country is present on the write.
- **Shared types/enums** — phone record and category-code types, type-level only.

## API endpoints

### GET /clients/{clientId}/phones · GET /admin/clients/{clientId}/phones

Lists a client's phones. The first form is the account holder acting on their own `clientId`; the second is a staff member acting on a named client's `clientId`, authenticated with the staff member's own bearer token. Both accept `with_staged_imports=1` to include staged-import rows in the result (otherwise they are omitted).

```bash
# Self
curl "$API/clients/$CLIENT_ID/phones?with_staged_imports=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Staff, on behalf of a named client
curl "$API/admin/clients/$TARGET_CLIENT_ID/phones?with_staged_imports=1" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN"
```

Sample response, `200` (values illustrative — no wire recording has been captured for this endpoint yet; this shape mirrors the module's own test fixtures // stubbed):

```json
{
  "status": "ok",
  "data": [
    {
      "id": "phone-1",
      "client_id": "target-client-9",
      "user_id": "target-client-9",
      "can_delete": true,
      "default": 1,
      "verified": 1,
      "staged_import": false,
      "type": 1,
      "phone": "+15551234567",
      "phone_code": "1",
      "phone_country_code": "US",
      "full_phone": "+1 555 123 4567",
      "international_phone": "+1 555-123-4567",
      "created_at": null,
      "updated_at": null,
      "deleted_at": null,
      "import_id": null
    }
  ],
  "related": null,
  "total": 1,
  "error": null,
  "messages": []
}
```

### POST /clients/{clientId}/phones · POST /admin/clients/{clientId}/phones

Creates a phone. `type` is required; a request missing it is rejected.

```bash
curl -X POST "$API/admin/clients/$TARGET_CLIENT_ID/phones" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5559876543",
    "phone_code": "+1",
    "phone_country_code": "US",
    "type": 1
  }'
```

Sample response, `201` (// stubbed — no captured recording yet):

```json
{
  "status": "ok",
  "data": {
    "id": "phone-2",
    "type": 1,
    "phone": "5559876543",
    "phone_code": "+1",
    "phone_country_code": "US",
    "can_delete": true,
    "default": 0,
    "verified": 0,
    "staged_import": false,
    "import_id": null,
    "full_phone": "+1 555 987 6543",
    "international_phone": "+1 555-987-6543",
    "client_id": "target-client-9",
    "user_id": "target-client-9",
    "created_at": null,
    "updated_at": null,
    "deleted_at": null
  }
}
```

### PUT /clients/{clientId}/phones/{phoneId} · PUT /admin/clients/{clientId}/phones/{phoneId}

Edits a phone (`PhoneWriteBody`), or sets it as default (`SetDefaultBody`) — the same endpoint, discriminated by which fields the body carries. Rejected when the target record's `staged_import` is true.

```bash
# Edit
curl -X PUT "$API/admin/clients/$TARGET_CLIENT_ID/phones/$PHONE_ID" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "5551112222", "phone_code": "+1", "phone_country_code": "US", "type": 2 }'

# Set default
curl -X PUT "$API/admin/clients/$TARGET_CLIENT_ID/phones/$PHONE_ID" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "default": true }'
```

### DELETE /clients/{clientId}/phones/{phoneId} · DELETE /admin/clients/{clientId}/phones/{phoneId}

Removes a phone. Rejected when the target record's `can_delete` is false, or `staged_import` is true.

```bash
curl -X DELETE "$API/admin/clients/$TARGET_CLIENT_ID/phones/$PHONE_ID" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN"
```

Sample response, `200`: `{ "status": "ok", "data": null, "related": null, "total": null, "error": null, "messages": [] }`.

> No endpoint above has a captured wire recording backing it yet (this module's test suite drives its own hand-authored mock responses rather than replaying an ADR-025 fixture set) — the shapes above are sourced from the shared phone record type and the module's own tests, not a live capture. Treat them as a stubbed contract pending a real recording.

## Failure modes

1. **Hard success** — `2xx` with `data` populated as expected.
2. **Hard failure** — `4xx`, category `error`; a create/update missing `type` or a malformed number returns a `422` with field-keyed messages in `error.data`.
3. **Soft success (the one to plan around)** — create and update can settle `2xx` with `data` empty: the request succeeded but the platform returned no body for the created/updated record. A caller that assumes a populated record on every `2xx` create/update will occasionally receive nothing to read back.

## Lessons (hard-won)

- **Set-default is a partial update, not a separate endpoint.** The same edit endpoint accepts a body containing only `{ default: true }` and applies it as a default-flag change — a caller has to know the discriminator is the body shape, not the URL or method.
- **A staged-import row is read-only in every mutation, silently.** Edit, delete, and set-default calls against a `staged_import: true` row are expected to be withheld entirely by the caller rather than sent and rejected — the endpoints themselves were not observed to return a distinct error class for this case in this module's own tests, so a caller relying on server-side rejection alone, rather than checking the flag first, has not been proven safe.
- **Staff capability is a profile attribute, not a per-request grant.** The four capability codes live on the acting staff member's own profile (fetched at session start), not on the phone resource or in the request — a caller has to already know which codes the current staff session carries before attempting a capability-gated write, rather than discovering it from a failed attempt.
- **The admin path and the self path accept and return the identical phone shape.** Nothing about the record itself changes based on which path fetched it — only the URL namespace and the acting bearer token differ.
