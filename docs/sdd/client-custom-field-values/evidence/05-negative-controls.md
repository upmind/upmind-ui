# 05 — Negative-control certification (13 mutants, re-driven by me)

**Status: RECORDED.** For each mutant I applied it, ran the module's own specs, recorded which
assertion went RED, reverted, and verified the revert byte-identical. A mutant that passes is a
capability that is not proven; a mutant that fails for the *wrong* reason proves nothing either.

`verify-negative-controls.companion.md` binds this: **no green negative-control run for every new
control the story adds, no Needs Review.** The story now carries **13** controls — the original 11
plus two added after Review found two capability failures that had reached a PRESENT verdict
undetected. Those two new controls are the ones that matter most, because they guard exactly those
failures.

## Provenance of this table — all 13 re-driven together, on one settled tree

An earlier revision of this file certified 11 controls with denominators of `/59` (A) and `/48`
(B). Those were real measurements, but the suites have since grown. Rather than retro-fit new
denominators onto old runs — which would be reporting numbers I had not measured — **I re-drove
all 13 from scratch** on a single settled tree state, so every row below is a current, real
observation.

Settled baseline used for every row (SHA-256, first 12):

```
087205af1af9  client-custom-fields/client-custom-fields.mappers.ts
6eb8f8234cae  client-custom-fields/client-custom-fields.services.ts
424f743b1294  client-custom-fields/useClientCustomFields.actions.ts
10aa08e80a20  client-personal-details/client-personal-details.mappers.ts
7e9fe7720000  client-personal-details/client-personal-details.services.ts
f8fefafb9b7f  client-personal-details/usePersonalDetailsManager.actions.ts
```

Green baseline on that state: **module A 60/60 exit 0**, **module B 51/51 exit 0**
(30 unit + 21 integration).

Method per control:

```
git apply <patch>
npx vitest run --project unit --project integration src/modules/<module> --testTimeout=45000
git apply -R <patch>
shasum -a 256 <all 6 targeted production files>   # compared to the settled baseline
```

All 13 passed `git apply --check` first. All 13 mutate **production source**, never a test
assertion, so none can self-certify (the FE-2824 mode where the only assertion mirrors the label
it sets).

## Module A — `client-custom-fields` (6/6 RED for the right reason, denominator 60)

| Control | Named AC | Spec that went RED | Result |
| --- | --- | --- | --- |
| `clear-value` | AC-24 | `AC-24 an empty string coerces to an explicit JSON null, present in the diff` (+ `AC-10` round trip) | 2 failed / 60 |
| `code-keyed-shape` | AC-23 | `AC-23 the changed-values body is an object keyed by code, never an array`; `AC-23 contains exactly the fields that changed`; `AC-24`; `AC-10` | 4 failed / 60 |
| `image-order` | AC-21 | `AC-21 flushImages() resolves only after the dirty image's upload settles, with the REAL hash in the model` | 1 failed / 60 |
| `readiness-unbounded` | AC-6a / AC-6b | `AC-6a settles false when the definitions request fails`; `AC-6b settles false, never hanging, when the session never authenticates`; **also** `AC-6c` | 3 failed / 60 |
| **`readiness-brand-failure`** ⬅ NEW | **AC-6c** | `AC-6c settles false, bounded, when the brand read (GET clients/{id}) fails — not just when /custom_fields does` | **1 failed / 60** |
| `session-hardwired-id` | AC-2 | `AC-2 retargeting to another client's VALUES context addresses that client's own resource, on the session's own token` | 1 failed / 60 |

## Module B — `client-personal-details` (7/7 RED for the right reason, denominator 51)

| Control | Named AC | Spec that went RED | Result |
| --- | --- | --- | --- |
| `clear-custom-field` | AC-46 | `AC-46 keeps a cleared custom-field code in the body as null, never omitting it`; the new AC-46 pipeline spec; `AC-59` | 3 failed / 51 |
| `diff-only` | AC-45 | `AC-45 sends only the field that actually changed`; `AC-45 returns undefined for an empty diff`; `AC-48`; `AC-59`; **both** new pipeline specs | 6 failed / 51 |
| `falsy-native` | AC-47 | `AC-47 sends an empty-string publicName explicitly, never omitted`; the new AC-47 pipeline spec | 2 failed / 51 |
| **`clear-through-pipeline`** ⬅ NEW | **AC-47 + AC-46** | `AC-47 … the outbound PUT body is exactly {public_name: ""}` **and** `AC-46 … a request is issued carrying the cleared code` | **2 failed / 51** |
| `readiness-infinity` | AC-40 / AC-42 | `AC-40 settles isReady() to false and leaves the machine out of 'loading'`; `AC-42 resolves isReady() false and raises no unhandled rejection` | 2 failed / 51 |
| `seam-bypass` | AC-59 | `AC-59 projects a custom field's value exactly as A's own seam (mapCustomFieldValues, A-9) coerces it — never re-derived locally` | 1 failed / 51 |
| `session-hardwired-id` | AC-30 | `AC-30 reads AND writes clients/{id} for an EXPLICITLY NAMED profile — … and it is not the session's own` | 1 failed / 51 |

**13/13 certified red-for-the-right-reason.** In every case the failing assertion belongs to the
AC the control is named for, not an incidental collateral failure elsewhere.

## The two new controls in detail

### A — `client-custom-fields.readiness-brand-failure` (AC-6c)

```diff
-    enabled: () => isAddressable(clientId.value) && brand.isSettled.value
+    enabled: () => isAddressable(clientId.value) && !!brand.brandId.value
```

Reverts the gate to `!!brand.brandId.value`, which on a failed brand read *can never fetch at
all*, leaving an entry whose `isFetched` is unreachable and `isReady()` therefore unbounded. It is
detected **only** by the new AC-6c spec, which injects a 500 on `*/clients/*` — the brand read —
rather than on `*/custom_fields`. My run: **1 failed / 60**, RED on exactly AC-6c.

This is the control guarding Review's blocker 2 (module A's readiness never settling on a brand
failure, pinning module B's manager in `loading`). My original 11 controls covered readiness on a
*definitions* failure only, so that path was genuinely uncovered — I recorded that gap in
[`07-gaps-and-limits.md`](./07-gaps-and-limits.md) G9 and it is now closed by a real control.

### B — `client-personal-details.clear-through-pipeline` (AC-47 + AC-46)

```diff
-  const safeModel = restoreClearedFields(
-    useModelParser<ProfileModel>(context.schema, incoming, context.baseModel, {
-      allowExtraProps: false
-    }),
-    incoming
+  const safeModel = useModelParser<ProfileModel>(
+    context.schema, incoming, context.baseModel, { allowExtraProps: false }
   );
```

Deletes the `restoreClearedFields` wrapper from `parse()`. It fails **two different ways**, and my
run reproduced both verbatim:

```
AC-47 (native clear):  AssertionError: expected {} to deeply equal { public_name: '' }
                       - { "public_name": "" }
                       + {}
                       -> a PUT IS issued, but the body lands EMPTY

AC-46 (custom clear):  AssertionError: expected +0 to be 1
                       -> no diff is emitted, so ZERO requests leave
```

That asymmetry is why the AC-46 spec asserts **request count separately from body shape** rather
than folding both into one `toEqual` — a body assertion alone cannot fail when no request exists
to inspect. My run: **2 failed / 51**.

This is the control guarding Review's blocker 1 (the clear path writing an empty body and
reporting success — body `{}`, HTTP 200, old value returns). Both AC-46 and AC-47 are
`jtbd_carried_must_fix` rows.

### The native-clear semantics changed while I was driving — and I waited

Mid-round, module B's native clear was changed from `null` to `""` to match the oracle and the
recorded capture: legacy sends the blanked form value for **natives** and applies the `""→null`
coercion only to **custom fields**, and `fixtures/put-clients-id-case-native-falsy.json` recorded
`{"public_name": ""}`. The AC-47 assertion became `{"public_name": ""}`.

The legacy half of that claim is an **oracle** claim, so it inherits the oracle provenance caveat:
the checkout is a separate working tree whose branch moved mid-run, and it must be resolved by SHA
(`47fdeb0c053219cff5ee9c8276c2a741c6554178` for the late-verification phase this change belongs to)
and confirmed against the cited **symbol**, not a line number. See
[`README.md`](./README.md#oracle-provenance--read-before-following-any-legacy-citation).

I polled until the change had landed **and** the tree had been quiet, then re-baselined before
driving, because certifying against a half-applied tree proves nothing.

**A transient worth recording.** During that window I caught the tree mid-edit
(`client-personal-details.services.ts` at an intermediate hash) and measured module B at
**2 failed / 51** — the *unmutated* tree exhibiting precisely the mutant's two failure modes. Four
minutes later that file had returned to its settled hash and the same spec passed 2/2. So it was
an in-progress state, **not a regression in the settled tree**, and I am explicitly not reporting
it as one. It does, however, corroborate that the mutant faithfully reproduces the real bug shape:
an actual broken intermediate produced the same two signatures.

## Interaction the re-drive exposed

The two new specs also strengthen four **existing** controls, which the old 11-row table could not
show: `readiness-unbounded` now trips AC-6c as well (3 failed, was 2), `clear-custom-field` trips
the new AC-46 pipeline spec (3, was 2), `falsy-native` trips the new AC-47 pipeline spec (2, was
1), and `diff-only` trips both (6, was 4). More assertions now depend on each seam, which is the
point of adding controls at the pipeline level rather than only at the mapper.

## Revert integrity — RECORDED

Six production files are touched across the 13 patches. After the full sweep, SHA-256 of all six
against the settled baseline:

```
ALL 6 TARGET FILES BYTE-IDENTICAL to settled baseline
no .rej / .orig residue found
```

I ran no `git add` and no repo-wide git mutation at any point; `git apply` / `git apply -R` on a
single patch file is the whole extent of it.

## Authorship boundary

Per `rules/agent-seat-separation.md`, the **developer** authors these mutants (it knows the line it
changed) and other seats apply them blind. I authored none of them — I applied, observed and
reverted. A verifier or prover that reads implementation source to hand-author a must-fail patch
has breached diff-blindness.
