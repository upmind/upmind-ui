# Module: client-address-dry

> This doc describes the client-postal-address capability as this module's code and test fixtures capture it. A second implementation of the same capability exists in this codebase and is the one other modules currently depend on; this module is a parallel build used to validate a build process and is not itself consumed anywhere yet. That distinction is codebase-internal and does not change the platform capability described below.

## What it is

A client account holds zero or more postal addresses, one of which may be flagged default. The platform lets the account holder manage their own list, lets a staff member manage a named client's list on their behalf through a separate, admin-scoped path, and lets a staff member acting as that client — during an impersonation session — manage the same list through the account holder's own path, authenticated as that client. Every address carries a required category (Home / Office / Holiday / Company), a delete-eligibility flag, a default flag, a verification flag, and region/country identifiers used for formatting and, when a brand-level configuration option is enabled, for validation. For a staff member on the admin path, the platform additionally reports which of the list/create/update/delete actions their own session is currently permitted to perform against a client's addresses.

## Core concepts

- **Access path** — the same list/create/update/delete/set-default capability is reached one of two ways: the account holder's own path, or a staff member's admin path naming the target client. A staff member acting as a client during impersonation reaches the account holder's own path, authenticated as that client — the same path and shape a client uses for themself.
- **Default address** — exactly one address in a list may be flagged default at a time; setting a new default is a variant of the update operation, not a separate resource.
- **Type** — a required category code on every address (Home / Office / Holiday / Company). The platform rejects a write missing it.
- **Region requirement** — whether an address's region is mandatory is controlled by a brand-level configuration option, not by which actor is submitting the form; the same rule applies to every actor for a given brand.
- **Delete eligibility** — a per-address flag gating whether an address may be removed; the account-holder and staff paths both withhold the delete request client-side when this flag is false, rather than sending it and relying on the server to reject it.
- **Staff capability code** — a staff member's permission to list, create, update, or delete a client's addresses on the admin path is expressed as one of four named codes carried on the staff user's own profile, not on the address resource.
- **Staff capability read-state** — for a staff member on the admin path, a readable set of four permission flags (one per action) is exposed alongside the collection. This read-state and the corresponding action's availability always agree for a given session, because both are derived from the same permission check rather than two independent ones.

## Operations

| #   | Capability                                        | Inputs                                                                  | Outputs                                                                                                            |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | **List addresses**                                | actor's own identity, or a named target client (admin path)             | array of address records                                                                                           |
| 2   | **Create address**                                | address fields (street lines, city, postcode, region/country ids), type | the created address record                                                                                         |
| 3   | **Update address**                                | address id, address fields and/or type                                  | the updated address record                                                                                         |
| 4   | **Set default**                                   | address id                                                              | the updated address record, now flagged default                                                                    |
| 5   | **Delete address**                                | address id                                                              | success; withheld before the request is sent when the record's own delete-eligibility flag is false                |
| 6   | **Find-or-create address**                        | address fields (matched by id when supplied)                            | the matching existing address record, or the newly created one                                                     |
| 7   | **Read staff permission state** (admin path only) | —                                                                       | four boolean flags — whether the current staff session may list / create / update / delete this client's addresses |

- Capabilities 2–5, reached via the admin path, require the acting staff profile to carry the matching permission code; a staff profile missing a code cannot perform that capability via the admin path at all. Capability 7 reports the same absence as `false` for the matching flag rather than omitting it.
- Set-default (4) is a partial update, not a distinct write path — the caller submits an update carrying only the default flag.
- A client acting on their own addresses — including a staff member acting as that client — never receives the four staff permission flags; they resolve to nothing for that actor.

## Data shape

Source of truth is the fixture the platform returns, not just a narrower derived shape a particular consumer happens to read.

```typescript
// An address record, as returned by both the self and admin list/mutation endpoints
type AddressRecord = {
  id: string;
  client_id: string;
  user_id: string;
  name: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  county: string | null; // present on the wire; not surfaced as a distinct field by any operation above
  state: string | null;
  postcode: string | null;
  region_id: string | null;
  region?: {
    id: string;
    country_id: string;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
  }; // present when the list is requested with the region relation
  country_id: string;
  country?: {
    id: string;
    name: string;
    code: string;
    code3: string;
    vat: string;
    eea: number;
    phone_code: string;
    post_code_regex: string;
    created_at: string;
    updated_at: string;
  }; // present when the list is requested with the country relation
  type: number | null; // category code: 1 Home / 2 Office / 3 Holiday / 4 Company
  default: boolean;
  verified: number; // truthy = this address has been verified
  can_delete: boolean; // false = deletion is withheld for this record
  staged_import: boolean; // true = arrived via a bulk import; carried on the wire but not surfaced as a distinguishing flag by any operation above
  import_id: string | null;
  external_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// Request body for create/update (both self and admin paths)
type AddressWriteBody = {
  name?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state?: string;
  postcode: string;
  region_id?: string | null; // required when the brand's region-required option is enabled
  country_id: string;
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
    data: unknown | null;
  };
  messages: string[] | null;
};
```

## Dependencies

### Dependants — modules that read from this one

None. This is a net-new capability build with no consumer anywhere in the codebase today.

### This module's own dependencies

- **HTTP transport layer** — bearer-token attachment, currency injection, error-shape normalisation.
- **Actor/session identity** — supplies the acting bearer token: the account holder's own session token for the self path, or — for the admin path — a staff member's own session token, selected explicitly rather than by whichever session is currently active.
- **Region/country lookup data** — used to seed and format an address's country/region and to populate the form's selectable options.
- **Brand configuration** — used to determine whether region is a required field for the current brand.
- **Shared types/enums** — address record and category-code types, type-level only.

## API endpoints

### GET /clients/{clientId}/addresses · GET /admin/clients/{clientId}/addresses

Lists a client's addresses, with region and country detail included. The first form is the account holder acting on their own `clientId`; the second is a staff member acting on a named client's `clientId`, authenticated with the staff member's own bearer token.

```bash
# Self
curl "$API/clients/$CLIENT_ID/addresses?with=region,country&with_staged_imports=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Staff, on behalf of a named client
curl "$API/admin/clients/$TARGET_CLIENT_ID/addresses?with=region,country&with_staged_imports=1" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN"
```

Sample response, `200` (values from a captured recording, trimmed to one row):

```json
{
  "status": "ok",
  "data": [
    {
      "id": "20e43579-5e78-d184-78db-31643202d986",
      "import_id": null,
      "staged_import": false,
      "external_id": null,
      "client_id": "25d96e76-3ed0-913d-d52c-417482528340",
      "user_id": "sys",
      "default": false,
      "type": 1,
      "name": "10 Downing St",
      "address_1": "197 Highfield Road",
      "address_2": "",
      "region_id": "8d632507-9806-5d1e-82ec-8174e234e98d",
      "country_id": "825d96e7-63ed-0913-46c4-174825283406",
      "city": "London",
      "county": null,
      "postcode": "SW1A 2AB",
      "created_at": "2025-06-04 09:05:58",
      "updated_at": "2026-05-21 12:20:19",
      "deleted_at": null,
      "verified": 0,
      "can_delete": false,
      "region": {
        "id": "8d632507-9806-5d1e-82ec-8174e234e98d",
        "country_id": "825d96e7-63ed-0913-46c4-174825283406",
        "code": "3",
        "name": "Vesturland",
        "created_at": "2019-10-31 17:51:20",
        "updated_at": "2019-10-31 17:51:20"
      },
      "country": {
        "id": "825d96e7-63ed-0913-46c4-174825283406",
        "name": "Iceland",
        "code": "IS",
        "code3": "",
        "created_at": "2017-10-18 14:16:21",
        "updated_at": "2026-07-23 13:41:28",
        "vat": "7.50",
        "eea": 1,
        "phone_code": "+354",
        "post_code_regex": "^\\d{3}$"
      }
    }
  ],
  "related": null,
  "total": 98,
  "error": null,
  "messages": []
}
```

Fixture reference: `get-clients-id-addresses-with-staged-imports-1.json` (self path), `get-admin-clients-id-addresses-with-staged-imports-1.json` (admin path).

### POST /clients/{clientId}/addresses · POST /admin/clients/{clientId}/addresses

Creates an address. `type` is required; a request missing it is not guaranteed to succeed (see Failure modes).

```bash
curl -X POST "$API/admin/clients/$TARGET_CLIENT_ID/addresses" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fixture Address",
    "address_1": "1 Fixture Street",
    "address_2": "",
    "city": "Fixture City",
    "postcode": "FX1 1FX",
    "country_id": "3825d96e-763e-d091-3dc4-174825283406",
    "type": 1
  }'
```

Sample response, `200` (from a captured recording):

```json
{
  "status": "ok",
  "data": {
    "client_id": "25d96e76-3ed0-913d-d52c-417482528340",
    "address_1": "1 Fixture Street",
    "address_2": "",
    "country_id": "3825d96e-763e-d091-3dc4-174825283406",
    "region_id": "",
    "city": "Fixture City",
    "county": null,
    "postcode": "FX1 1FX",
    "name": "Fixture Address",
    "type": 1,
    "default": false,
    "verified": 0,
    "user_id": "825d96e7-63ed-0913-de6c-417482528340",
    "updated_at": "2026-07-31 08:21:45",
    "created_at": "2026-07-31 08:21:45",
    "id": "785d26e9-6783-d163-76eb-314502e70439",
    "can_delete": true
  },
  "related": null,
  "total": null,
  "error": null,
  "messages": []
}
```

Fixture reference: `post-clients-id-addresses.json` (self path), `post-admin-clients-id-addresses.json` (admin path).

### PUT /clients/{clientId}/addresses/{addressId} · PUT /admin/clients/{clientId}/addresses/{addressId}

Edits an address (`AddressWriteBody`), or sets it as default (`SetDefaultBody`) — the same endpoint, discriminated by which fields the body carries.

```bash
# Edit
curl -X PUT "$API/admin/clients/$TARGET_CLIENT_ID/addresses/$ADDRESS_ID" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Home", "address_1": "1 Fixture Street", "city": "Fixture City", "postcode": "FX1 1FX", "country_id": "3825d96e-763e-d091-3dc4-174825283406", "type": 2 }'

# Set default
curl -X PUT "$API/admin/clients/$TARGET_CLIENT_ID/addresses/$ADDRESS_ID" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "default": true }'
```

Fixture reference: `put-clients-id-addresses-id.json` (edit), `put-clients-id-addresses-id-case-set-default.json` (set default), `put-admin-clients-id-addresses-id.json` (admin path).

### DELETE /clients/{clientId}/addresses/{addressId} · DELETE /admin/clients/{clientId}/addresses/{addressId}

Removes an address.

```bash
curl -X DELETE "$API/admin/clients/$TARGET_CLIENT_ID/addresses/$ADDRESS_ID" \
  -H "Authorization: Bearer $STAFF_ACCESS_TOKEN"
```

Sample response, `200`: `{ "status": "ok", "data": null, "related": null, "total": null, "error": null, "messages": [] }`.

Fixture reference: `delete-clients-id-addresses-id.json` (self path), `delete-admin-clients-id-addresses-id.json` (admin path).

## Failure modes

1. **Hard success** — `2xx` with `data` populated as expected.
2. **Hard failure** — a create submitted without authentication returns `401` with the message "Please log in to continue" (`get-clients-id-addresses-case-unauthorised.json` shows the equivalent unauthenticated read). A create that already matches an existing address for the client is rejected outright with `409` and the message "You already have this address." rather than silently deduplicated (`post-clients-id-addresses-case-invalid.json`) — a caller must surface this as a distinct outcome, not retry the same submission.
3. **Soft success (the one to plan around)** — create and update can settle `2xx` with `data` empty: the request succeeded but the platform returned no body for the created/updated record. A caller that assumes a populated record on every `2xx` create/update will occasionally receive nothing to read back.

## Lessons (hard-won)

- **Set-default is a partial update, not a separate endpoint.** The same edit endpoint accepts a body containing only a default flag and applies it as a default-flag change — a caller has to know the discriminator is the body shape, not the URL or method.
- **A record that arrived through a bulk import surfaces identically to any other record in this collection.** Unlike some other client-resource lists this platform exposes, there is no distinguishing flag or edit/delete lockout applied to such a record here — every list read still requests import rows be included, and once included they behave like any other row.
- **Staff permission is a profile attribute, not a per-request grant.** The four permission codes live on the acting staff member's own profile, fetched at session start — a caller has to already know which codes the current staff session carries before attempting a permission-gated write, rather than discovering it from a failed attempt.
- **The staff permission read-state and the gated actions are guaranteed to agree.** Both are derived from the same underlying permission check for a given session, so a caller can trust the readable flags as an accurate preview of which actions are actually available, rather than treating them as a separate, potentially-stale hint.
- **The admin path and the self path accept and return the identical address shape.** Nothing about the record itself changes based on which path fetched it — only the URL namespace and the acting bearer token differ.
- **Region requirement is a brand-wide setting, not an actor distinction.** The same validation rule (region required, or not) applies to every actor writing on behalf of a given brand — it is not something staff or a client individually opt into.
