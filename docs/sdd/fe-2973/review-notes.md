# FE-2973 — Review Notes

**Story:** Harden scope-switching + brand routing (URL brand-prefix mechanic)
**Status:** DONE (merged 2026-08-26)

---

## 2026-08-26: Re-planning run

**Reviewer:** planner seat (SDD re-plan)

### Finding: SDD was stale — R1-R4 already implemented

The original SDD (dated 2026-07-XX) described all five requirements as TODO. Oracle consultation found:

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| R1 (SessionUser brand fields) | DONE | `session-store.types.ts` L147-152, `session-store.mappers.ts` L91-92 |
| R2 (Staff `.inBrand()` threading) | DONE | `AuthJourney.vue` L216, L227, L237 |
| R3 (Session brand gate) | DONE | `useActorScopeSelector.ts` L139 `isSessionValidForBrand()` |
| R4 (Brand dropdown) | DONE | `BrandSegment.vue` complete |
| R5 (Impersonation pickers) | OPEN | `ActingForSegment.vue` L166-171: "No client search exists in core" |

### Action: Updated all SDD artifacts

- `requirements.md`: Added implementation status table, marked AC1-AC6 as DONE, added executable read-backs for all ACs
- `design.md`: Removed redundant completed work details, focused on R5 design
- `tasks.md`: Removed completed tasks T1-T4, focused on R5 subtasks
- `parity.yaml`: Updated dispositions from `Parity` to `Parity-DONE` / `Parity-OPEN`

### Remaining scope: R5 only

The story scope is now **S** (down from M): 2 new files, ~150 lines.

**Tasks:**
1. Create `playgrounds/labs-nuxt/app/services/impersonation.ts`
2. Extend `ActingForSegment.vue` with API-backed client search
3. Add staff search picker (same component or separate)
4. Wire impersonation token to session-store

### Legacy oracle consultation

- `vue-app/src/components/app/global/client/clientSearch.vue` — debounced search, brand filtering, avatar+name+email display
- `vue-app/src/components/app/admin/users/usersProvider.vue` L181-184 — `impersonate(userId)` dispatches `auth/admin/impersonateStaff`

### No dropped capabilities

All 7 parity cells for R1-R4 are `Parity-DONE`. The 2 cells for R5 are `Parity-OPEN` (work remaining, not dropped).

---

## Pending approval

This re-planned SDD is ready for `/sdd-review`.

**Risk:** None. R1-R4 are already shipped code. R5 is additive.
