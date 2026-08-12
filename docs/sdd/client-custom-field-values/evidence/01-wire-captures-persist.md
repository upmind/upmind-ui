# 01 — Wire captures: the persist path

**All RECORDED** — observed on the real outbound wire by me, in the real running app, against
`https://api.staging.upmind.io`. Nothing here is constructed.

Client under test: `25d96e76-3ed0-913d-d52c-417482528340`
(`nathan.robinson+checkouttest@upmind.com`), the same client the fixtures record.

## Capture 1 — setting a custom-field value (`age` → 37)

Driven through the real UI: `/account/profile/edit?fields=customFields.age`, typed `37`, pressed
Apply.

```
PUT /api/clients/25d96e76-3ed0-913d-d52c-417482528340
body={"custom_fields":{"age":37}}
```

Read-back after the app's own redirect to `/account/profile`:

```
API GET /api/clients/{id}?with=custom_fields,custom_fields.field
    -> custom_fields: [{"code":"age","value":37},{"code":"profile_picture","value":null}]
RENDERED: "Age\n\nValue: 37\n\nProfile Picture\n\nValue:\n\n..."
```

## Capture 2 — the same round trip, unstubbed (`age` → 44)

Repeated with **no `route()` stub of any kind** in the browser (see
[`03`](./03-ac60-unstubbed-app-readback.md)):

```
PUT /api/clients/25d96e76-3ed0-913d-d52c-417482528340
body={"custom_fields":{"age":44}}
```

Read-back:

```
API GET -> custom_fields: [{"code":"age","value":44},{"code":"profile_picture","value":null}]
RENDERED: "Language\n\nValue: English\n\nEdit\n\nAge\n\nValue: 44\n\n"
```

## What these two bodies prove, and what they do not

That single body line carries four ACs at once:

| Evidence in the body | AC |
| --- | --- |
| Only the field I touched is present — no untouched native key | AC-45 diff-only body |
| `custom_fields` is an **object keyed by code**, not an array | AC-23 |
| `37` / `44` are JSON **numbers**, not the strings `"37"` / `"44"` | AC-13 / AC-14 per-type coercion |
| The request addresses the client's own resource | the persist target |

**What they do NOT prove — stated plainly, because it was a real hole in my read-back.** Both
captures exercise **setting** a value. Neither exercises **clearing** one. Review subsequently
found that the clear path wrote an empty body and reported success:
`useValidation.ts:483`'s `compactDeep(model, {preserveContainers:true})` combined with
`isDeepEmpty.ts:27` treating `""` as non-meaningful and `:66` omitting the key meant a cleared
field reached the mapper **absent**; `mapIProfileFields` set `diff.firstname = undefined`; the
empty-diff short-circuit missed because `Object.keys(diff).length === 1`; and `JSON.stringify`
dropped the key — producing body `{}` with HTTP 200 and the old value returning.

That is **REPORTED (not observed by me)** — attribution: the Review seat's blocker 1. It is
recorded here rather than omitted because it is the direct limit of the evidence above: AC-46 and
AC-47 are `jtbd_carried_must_fix` rows, and my round trips left the *clearing* half of the manage
verb unproven. The fix is reported captured as `{"public_name":null}`; I have **not** verified
that myself this round (the tree is actively being worked in, and re-verification is owed
post-commit).

## Non-destructiveness of a blank form — RECORDED

Before Review's finding, I checked the adjacent risk myself: opening
`/account/profile/edit?fields=publicName` and pressing Apply **without typing**.

```
model on load = {}
meta.isDirty  = true
Apply enabled = true
PUTs issued   = NONE          <- AC-45's empty-diff no-op held
After re-read : "Public name\n\nValue: Checkout T.\n\nEdit"
```

So the empty-diff short-circuit did hold on **this** path (nothing typed at all). Review's
blocker 1 is the neighbouring path (a field explicitly cleared to `""`), which my test did not
reach — the two are distinct, and my result does not contradict theirs.
