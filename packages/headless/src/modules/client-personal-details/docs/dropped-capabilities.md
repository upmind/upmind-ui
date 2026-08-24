# client-personal-details — Dropped Capabilities

This file records ONE capability the legacy application supports that this module deliberately does not build: **a staff member editing a client's profile on that client's behalf.** It is not a bug list and not a roadmap — it is a receipt. Anyone reading only the code sees a scope matrix that refuses a `staff` actor at compile time; nothing in the code says whether that refusal is a considered decision or an accidental gap. This file is what turns "refused" into "refused on purpose, and here is where the missing work is tracked."

> **Why this file has to exist, not just be true.** This module's only delivered actor is `client`, and its everyday call resolves the target profile from the caller's own session identity unless a context id is supplied. That is the same surface shape a silently-dropped capability takes: one actor, session-derived identity, no second arm. The only thing distinguishing this module's actual design — a staff arm that was never owed in the first place — from that failure is this file existing and being accurate. Without it, "never built" and "built, then quietly removed" look identical from outside the module.

## The refusal, and where it is enforced

`PERSONAL_DETAILS_SCOPE_MATRIX` (`client-personal-details.types.ts:57`) pins the staff key to `null as never`. That is not a runtime check — it means `usePersonalDetails().as('staff')` and `usePersonalDetailsManager().as('staff')` both fail to compile. There is no code path in this module that a staff actor can reach at all.

The legacy application does support a staff-editing surface. Its admin client page (`vue-app/src/views/admin/clients/client/profile/index.vue`) mounts the same profile form component the client's own self-service page uses (`vue-app/src/components/app/global/client/clientProfileBasicConfigurationComp.vue` → `clientProfileBasicConfigurationForm.vue`), and that shared form component carries an admin-only branch inside it. This module is built against the client's own self-service half of that shared form only.

## The dropped capabilities

Thirteen distinct capabilities, each verified directly against the legacy source cited, not against a description of it:

| #   | Capability                                                                                                                                                                              | Legacy source                                                | Disposition                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| 1   | Staff opens and addresses a client's profile at all — the identity retarget every row below depends on.                                                                                 | `views/admin/clients/client/profile/index.vue:4-13`          | `Dropped-with-Linear-issue` (FE-2298) |
| 2   | A "client number" field, visible and editable to staff.                                                                                                                                 | `clientProfileBasicConfigurationForm.vue:125-139`            | `Dropped-with-Linear-issue` (FE-2298) |
| 3   | A "client since" (creation date) field, visible and editable to staff.                                                                                                                  | `clientProfileBasicConfigurationForm.vue:141-153`            | `Dropped-with-Linear-issue` (FE-2298) |
| 4   | A "disable email notifications" toggle, visible and editable to staff.                                                                                                                  | `clientProfileBasicConfigurationForm.vue:155-162`            | `Dropped-with-Linear-issue` (FE-2298) |
| 5   | An inline notice, shown to staff only, when the client's email is unverified.                                                                                                           | `clientProfileBasicConfigurationForm.vue:19-22`              | `Dropped-with-Linear-issue` (FE-2298) |
| 6   | A staff action to resend that client's verification email — the link only renders behind one dedicated permission, and the action itself re-checks a second permission before it fires. | `clientProfileBasicConfigurationForm.vue:23-25,408-410`      | `Dropped-with-Linear-issue` (FE-2298) |
| 7   | A permission gate on whether the staff view of a profile loads at all — absent on the client's own self-service view, which needs no such check.                                        | `clientProfileBasicConfigurationForm.vue:3,273-277`          | `Dropped-with-Linear-issue` (FE-2298) |
| 8   | A permission gate on whether staff can edit any field of a profile at all, checked independently of the load gate above.                                                                | `clientProfileBasicConfigurationForm.vue:279-281`            | `Dropped-with-Linear-issue` (FE-2298) |
| 9   | Every field locked while the target client's record is a staged, not-yet-processed import.                                                                                              | `clientProfileBasicConfigurationForm.vue:254-256`            | `Dropped-with-Linear-issue` (FE-2298) |
| 10  | A guard that redirects a single-brand staff session away from a client belonging to a different brand, rather than showing a mismatched form.                                           | `clientProfileBasicConfigurationForm.vue:301-308`            | `Dropped-with-Linear-issue` (FE-2298) |
| 11  | For a multi-brand staff session, a language list fetched fresh for the target client's own brand, instead of a fixed list.                                                              | `clientProfileBasicConfigurationForm.vue:231-240,322-336`    | `Dropped-with-Linear-issue` (FE-2298) |
| 12  | A single "Save" action that commits this profile form together with the sibling custom-fields form in one step.                                                                         | `views/admin/clients/client/profile/index.vue:45-51,120-123` | `Dropped-with-Linear-issue` (FE-2298) |
| 13  | A single "Revert" action that restores both of those same forms together.                                                                                                               | `views/admin/clients/client/profile/index.vue:45-51,124-127` | `Dropped-with-Linear-issue` (FE-2298) |

Rows 12 and 13 span this module's own form and the sibling custom-fields module's form together — the legacy page saves and reverts both under one control when opened by staff. Only this module's half of that combined action is this module's own capability; the sibling module's half is that module's own concern to track, if it has not already.

Rows 6, 7, and 8 are three separately-checked permissions, not one: `request_verification_client_email` (row 6, gates whether the resend link even renders), `get_client` (row 7, gates whether the staff view loads at all), and `update_client` (rows 6 and 8 — re-checked before the resend request actually fires, and checked again to gate every field's editability). None of the three exists anywhere on the client's own self-service path.

## Tracking

Every row above carries the disposition **`Dropped-with-Linear-issue`**, tracked as:

> **Linear FE-2298 — "Create staff profile editing UI"**
> Status: Backlog. Parent: FE-2288. Project: Admin Panel 2.0.
> Its own acceptance criteria are the drop this file records: "Staff can edit client profiles", "Staff-specific fields visible", "Reuses client profile components with scope".

Closing FE-2298 is what would retire every row in the table above. Until then, the compile-time refusal in `PERSONAL_DETAILS_SCOPE_MATRIX` and the rows above are expected to stay in lockstep — a change to one without the other is exactly the kind of drift this file exists to prevent.
