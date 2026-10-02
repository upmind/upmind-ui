# Affiliate Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the test scenarios marked with 🧪 below. The last section lists behaviour that is wired but unproven.

---

## A 404 on the account or balance read resolves as empty, not as an error 🧪

The account and balance reads call TanStack `useQuery` directly, not the platform's `useQuery().query()` wrapper. A client who never enrolled gets 404 on both. The query function turns that 404 into a resolved `null`, and `select` maps it to `undefined`. The wrapper cannot do this: it has no hook to intercept a rejection, so a 404 there always sets `isError`.

```typescript
// ❌ Wrong: a not-enrolled client shows an error banner
const { isError } = useQuery().query({ url: useUrl(`accounts/${id}/affiliate`) });

// ✅ Correct: the module's read resolves empty
const affiliate = useClientAffiliate().as("client");
affiliate.useMeta().isEnrolled.value; // false, hasError false
```

Any non-404 failure still rejects and sets `hasError`. No `placeholderData` is set, so a key change (the account id clears) empties `data` at once.

**Test scenario:** Sign in as a client who never enrolled. Open the affiliate area. `isEnrolled`, `isDisabled` and `isStaged` read `false`, and no error shows. Then call `enrol()` and confirm the record loads.

---

## Brand configuration keys are read by their literal dotted names 🧪

`config/brand/values` answers a flat map whose keys are the literal `BrandConfigKeys` strings, for example `"affiliate_systems.settings.withdraw_request"`. The module reads them with bracket access.

```typescript
// ❌ Wrong: treats the dots as a path
get(settings, "affiliate_systems.settings.withdraw_request");

// ✅ Correct: the key is one flat string
settings[BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST];
```

A key the brand never set is missing from the map. The module treats a missing key as falsy or `""`.

**Test scenario:** Read the area keys for a brand with the withdraw setting on. `canWithdraw` is true only with a non-zero available balance too.

---

## The `upm_aff` cookie is written raw 🧪

The cookie value is the opaque string from the platform. The module writes it through `useCookies().setTopLevel` with an identity encoder and reads it back with an identity decoder. The default codec JSON-encodes and base64-encodes values, and a value written that way is not the one the platform handed out.

```typescript
// ❌ Wrong: the default codec
useCookies().set("upm_aff", value);

// ✅ Correct: raw, top-level domain, path "/"
useCookies().setTopLevel("upm_aff", value, { path: "/", "max-age": maxAge }, identityEncoder);
```

`max-age` is set only when the response carries a non-zero lifetime. A visit answer with no cookie value deletes the cookie with `removeTopLevel`.

**Test scenario:** Visit `/aff/{hash}` twice. The second request body carries `referral_cookie` equal to the first answer's value. Visit an unknown hash and confirm the cookie is deleted.

---

## i18n keys carry their catalogue namespace 🧪

Translation keys passed to `useI18n().t` include the namespace prefix: `error.affiliate_link_not_available`, `error.affiliate_account_not_member`, `error.affiliate_payout_destination_not_available`, `error.affiliate_link_form_timeout`, `error.affiliate_payout_destination_form_timeout`, and `text.affiliate_withdraw_balance`. A bare `affiliate_link_not_available` resolves to nothing and the user sees the raw key.

```typescript
// ❌ Wrong
t("affiliate_link_not_available");

// ✅ Correct
t("error.affiliate_link_not_available");
```

Form and criteria labels use `form.affiliate_*` through the uischema `i18n` key.

---

## The managers' `update()` resolves on a settled server failure 🧪

A 422 or 5xx on a link or destination save does not reject `update()`. The manager returns to `available`, the error lands in context, and `update()` resolves with the model. Only a machine that never settles rejects (a timeout error).

```typescript
// ❌ Wrong: the catch never runs on a refused save
try {
  await manager.useActions().update();
} catch (error) {
  showError(error);
}

// ✅ Correct: read the state afterwards
await manager.useActions().update();
if (manager.useMeta().hasError.value) showError(manager.useContext().errors.value);
```

For the link manager, `errors` joins the per-field 422 messages (for example `"The redirect url field is required."`) ahead of the generic `"API request invalid!"`. A second `update()` after a refused save sends the save again. The payout manager behaves the same way: it keeps the edit, does not re-read after a refusal, and a second `update()` sends the save again.

**Test scenario:** Create a link with an empty redirect. `update()` resolves, `hasError` is true, `errors` reads the field message. Fix the value and call `update()` again; a second request goes out.

---

## A create link editor is dirty on open 🧪

A new link's baseline model is `{}`, and its seeded model carries the brand default redirect (or nothing, since the model parser drops empty values). The editor therefore treats a new link as changed from the first moment, whatever the seed. `isDirty` is `isNew || model differs from baseline`.

```typescript
const draft = useAffiliateLinkManager().as("client").fresh();
await draft.useActions().isReady();
draft.useMeta().isDirty.value; // true, before the client types
```

An edit of an existing link starts clean and turns dirty only when the model differs. The payout destination editor starts clean: `isDirty` is false on open, true after a change, and false again after the save re-reads the account.

---

## A collection must not keep another account's rows

Collections keep a key of their own. When the active account clears, the key clears, and `placeholderData` serves no previous rows. The earlier implementation compared the previous query key's account to the current one. That key embeds the same mutable ref, so both sides read `undefined` after a clear and matched, and the previous account's rows stayed on screen.

---

## Settings reads can race an account change

`useClientAffiliate` stamps each settings load with a generation. A slower load for the previous account, released after a new account id arrived, is dropped. When the id clears to no account, the generation does not move, so the older load still writes its result. The values are brand-level, so the effect is small. `isReady()` stays pending until the new account's settings load finishes. A failed gate or area read leaves its map empty (programme off, `canWithdraw` false) and does not raise an error.

---

## Two commission status orderings

`commissionTagStatus` checks rejected, on hold, awaiting payment, pending approval, cancelled, approved. `commissionSummaryStatus` checks rejected, awaiting payment, pending approval, on hold, cancelled, approved. The orderings follow two separate legacy components. Both test "pending approval" before "cancelled", so neither ever returns `"cancelled"`.

---

## Text filters compare by contains only (DV1) 🧪

The legacy listings let a client filter a text column by "starts with" or "ends with". This module sends `like` as contains-only, on four string columns: the links `name` and `redirect_url`, and the referrals `affiliate_link.name` and `affiliate_link.redirect_url`. A starts-with or ends-with leaf is refused as a schema violation, and no request goes out. The platform's `like` takes a SQL-style pattern, so `v%` and `%v` express starts-with and ends-with. The module does not offer them, and no recorded test claims them.

**Test scenario:** Write a starts-with leaf on the links `name` column. The write is refused and the observer sees no request.

---

## A filter or sort write returns the page offset to zero (DV2)

In the legacy table a filter or sort change kept the page the client was on. Here the offset returns to zero. A consumer that wants the legacy kept page restates `pagination` in the same `setCriteria` write. The behaviour is characterised by a spec and carries no negative control.

---

## An empty page lands on the last page (DV3)

The legacy table re-read page one when the page past the end came back empty. Here the query core lands on the last page that holds rows. The behaviour is characterised by a spec and carries no negative control.

---

## A write during a load is honoured (DV4)

The legacy table dropped a filter, sort or page write made while a load was in flight. Here the write is honoured, and the later window wins. A consumer that wants the legacy guard disables its control on `isLoading`. The behaviour is characterised by a spec and carries no negative control.

---

## A page or size write on an empty table is honoured (DV5)

The legacy table ignored a page or page-size write when it held no rows. Here the write is honoured. A consumer that wants the legacy guard disables its control while the list holds no rows. The behaviour is characterised by a spec and carries no negative control.

---

## `isLoading` stays false on a refetch (DV6) 🧪

The legacy view raised `isReloading` during a reload. Here `isLoading` is true for the first read only. It stays false on a refetch over loaded data, and on a refresh after a failed read. A consumer that shows a reload indicator cannot derive one from `isLoading`.

**Test scenario:** Load the account, then refetch it. `isLoading` stays false while the refetch runs.

---

## A settings failure is silent (DV9)

The legacy view went to an error state when the settings read failed. Here a failed settings read leaves its map empty (programme off, `canWithdraw` false) and raises no error. `hasError` stays false. This fixes a defect: a failed brand-level read no longer hides an account that loaded.

---

## A visit answer with status zero or an empty body still redirects (DV10) 🧪

The legacy visit never redirected when the answer carried status zero. Here status zero and an empty body both resolve the visitor's own origin, so the visitor always has a target. This fixes a defect.

**Test scenario:** Answer the visit request with status zero. `visit()` resolves the origin and does not reject.

---

## The cookie delete reaches the host-only cookie (DV11) 🧪

`removeTopLevel` deletes the `upm_aff` cookie on the top-level domain. On a restricted apex domain it deletes the host-only cookie. On any other host it deletes the apex-domain cookie. A real browser keeps a host-only `upm_aff` there only if something else wrote one, and neither this module nor the legacy app writes one. The legacy delete missed a host-only cookie. This fixes a defect.

---

## The session copy of the account is not reconciled after a payout save (DV13)

After a payout destination save the module re-reads its own account. The copy of the account held in the client session keeps the payout ids it had before the save. No reader of that copy exists today, so nothing shows the stale ids. A consumer that reads the payout ids from the session must read them from this module instead.

---

## Dates must be UTC or a relative token (DV14) 🧪

An absolute date leaf carries a UTC value shaped `YYYY-MM-DD HH:mm:ss`. A relative leaf carries a token such as `-1_months`. A local time shifts the window by the UTC offset of the client.

```typescript
// ❌ Wrong: a local time
"2026-10-02 09:00:00"; // built from new Date() in a UTC+2 zone

// ✅ Correct: UTC, or a relative token
"2026-10-02 07:00:00";
"-1_months";
```

**Test scenario:** Filter the commissions by a local-time date in a zone away from UTC. The window sits at the UTC offset from the one the client meant.

---

## Common Mistakes

### Using the Links list for a link edit

The list is criteria-driven and keyed on the account. The editor reads the one link itself (`GET .../links/{id}`). Open the editor with `.withId(linkId)`, not `.for(...)`.

### Joining the referral URL without the origin guard

`referralOrigin` is `""` when the brand has no `default` oauth client. The module builds no URL. Check for the empty string before joining `{origin}/aff/{hash}`.

### Dotted filter keys

The referrals list filters `affiliate_link.*` columns. Keep them as literal schema keys. A nested path is rejected as an extra property.

### Expecting `.for(...)` or a switcher

There is no account switching, no stored choice and no `.for(...)` retargeting. A client with several accounts and no matching `/self` account id has no active account.

---

## Edge Cases

| Scenario | Expected Behavior | Notes |
| --- | --- | --- |
| No account is active | Reads stay idle, `isAvailable` false | Manager `isReady()` settles `false` straight away |
| A staff or guest actor opens a client composable | Refused at runtime | Managers settle `unavailable` with no request |
| Brand has no default redirect | New link opens with an empty redirect | The key is absent from the answer; the editor still opens dirty |
| Brand sets a default redirect | New link opens with it as `redirectUrl` | Read when the area settings answer; a late answer still seeds it |
| Payout destination is unset (`null`) | Treated as the brand's default destination | `isPaypal` follows the default's code |
| PayPal destination, client has emails | Default email (else first) preselected | Only when the email is empty |
| Destination or email lookup fails | Lookup is empty, the form still seeds | No error raised |
| Visit request fails | Resolves the visitor's own origin | Never rejects |
| Referrer present on a visit | Appended to the target as `upm_referrer`, encoded twice | Matches the legacy target |
| Saved account for a lost membership | Rejected before any request | `error.affiliate_account_not_member` |

---

## Known Unproven Behaviour

These behaviours are wired in the code. No recording or live state proves them, so no test claims them. Each is a pending scenario in `__tests__/affiliate.feature`.

| Handle | What is not proven |
| --- | --- |
| Staged condition (`NO-STAGED-LOGIN`) | `isStaged` reading `true`. The staged account could not be read (its login is refused), so the flag is read from `staged_import` as the legacy app does and no recording holds it |
| Single-account fall-back (`NO-SELF-WITHOUT-ACCOUNT-ID`) | The fall-back to the client's only account when `/self` has no account id. Every client on the staging brand has one |

Proven since the earlier list: a new link opens with the brand's default redirect as its redirect when the brand sets one, including when the settings answer after the editor opens, and opens with an empty redirect when the answer holds no such key. A disabled account reads `isDisabled` true with no error. A never-saved destination inherits a PayPal brand default, so PayPal is offered and a PayPal email is required. A client with an empty destination and no PayPal email opens with the default email preselected. After an email is added, the editor's list is replaced by the list read after the add, and the unsaved destination choice is kept. A stored PayPal destination with no PayPal email is unreachable in practice, so no state exists to record.

Other proof limits: offset writes on the links and payouts lists, and the module-level mock-contract check, have no test. `vue-tsc -p tsconfig.testcheck.json` reported 13 errors in this module's test files and none in its source files, on 2026-10-02. The errors sit in test typing, such as a missing `happyDOM` global and shared test helpers. The check is not a CI gate.

---

## Lifecycle Considerations

### Destroy the Instance When Done

If you create a composable in a component, destroy it on unmount to stop the service and remove it from the registry:

```typescript
onUnmounted(() => links.useActions().destroy());
```

### Wait for Ready State

Before reading or writing, wait for the account id and the first fetch:

```typescript
await affiliate.useActions().isReady();
```

`useClientAffiliate().useActions().isReady()` resolves `false` for a non-client actor or when no account is active. Manager `isReady()` rejects with a timeout error after 15 seconds if the manager never settles.
