# stats Changelog

All notable changes to the stats module.

## [Unreleased]

### Added

- `useStats` — ONE composable for the client dashboard's stats, SELF context only. It carries the four stat tiles (total orders, total invoices, unpaid invoices, active support tickets), each a fixed-parameter `GET api/stats` read currency-summed to the platform's own `ALL` key, AND the partner-usage read (`GET api/clients/upmind_usage`), client-path only, over one identity seam.
- The active-tickets tile's visibility gate, driven by an already-loaded brand support-system setting, and failing OPEN on a broken gate read (the opposite default to most visibility gates elsewhere in the codebase — see gotchas.md).
- The Upmind host-context gate on the usage read alone: a hostname allowlist read from `VITE_APP_UPMIND_HOSTNAMES`, never a field on the client record. It closes the usage query's `enabled` and `guard`, `isUsageReady()`'s early return, and `isLoadingUsage`.
- `reset()` for the tiles and `resetUsage()` for the usage read, each dropping its own cached data without itself issuing a refetch.
- `isEmpty` for the tiles, reporting `true` only while none of the four holds a number and the read has not failed.
- Behavioural scenarios in `__tests__/stats.feature`, each replayed from verbatim staging recordings kept one folder per step under `__tests__/scenarios/`: the four counts, an absent count and a real zero, the support-system-off ticket count, the usage refusal (hidden block and reported refusal), the not-empty flag for a real zero, and the signed-out guard. Per-query loading, abort on destroy, refetch, readiness, the session's package limits and the scope's self-resolution are proven by the query, session-store and scope modules and are recorded in the feature as moved, not re-tested here.

### Changed

- **The module directory is `stats/`, and its ONE composable is `useStats`.** It previously shipped `useClientStats` and `useUpmindUsage` from a `client-stats/` directory. The two are merged; the behaviour of every read, gate and flag is unchanged.
- **The two concerns keep DISTINCT members in the merged surface.** The usage read is host-gated and the tile reads are not, so a shared flag would be wrong the moment the usage half is gated off. Renames, one for one: `useUpmindUsage().useActions().isReady` → `isUsageReady`; `.refresh` → `refreshUsage`; `.reset` → `resetUsage`; `useMeta().isLoading` → `isLoadingUsage`; `.hasError` → `hasUsageError`; `.isVisible` → `isUsageVisible`; `useContext().error` → `usageError`; `useContext().data` → `data.usage`; `useInternals().query` → `usageQuery`. The tiles' members keep their names. `isAvailable` and `destroy` are now shared, because one services instance and one scope back both halves.
- The scope matrix is `STATS_SCOPE_MATRIX` and declares `SELF` alone. `.for()` stays a compile-time error for every actor, exactly as before.

### Known limitations

- **The Upmind-usage success path is a signed drop from this module's proof, not a missing feature.** No account with recordable success-path access exists in the credential set this module was built against: every account available answered the usage endpoint with the same refusal, so the success path has no recordable fixture and no executable read-back. The landed composable, its request, and its refusal handling are unaffected and stay exactly as shipped — the drop is about the proof, not the source. A later change re-opens the success path once an account that can produce a recordable success response exists. Porting field names from the legacy dashboard's usage panel into code that reads this composable would be building against an unverified contract — see gotchas.md.
- **`isEmpty`'s `true` state has no recording.** It reads the normalised counts and is `true` only while none of the four holds a number and no read has failed. A real zero among real numbers reads `false` (recorded). No recorded account answers all four reads with no report, so the `true` side is not proven against a recording.
- The package-limits bag on a client's own record is read elsewhere (the session layer), not through this module — a caller wanting that value does not find it here.
- The four stat tiles have no capability to change the report window; the window's end is always the day of the read.

---

## Migration Guide

### From v1.x to v2.x

> _No migrations yet — this module has not shipped a breaking version change._
