# stats Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the test scenarios marked with 🧪 below.

---

## 1. The Upmind-usage panel has no proven success state 🧪

`useStats` ships the usage request and its refusal (`409`) handling. It does **not** ship a proven success state: that half is a **signed parity drop**, not a missing implementation. No account available while this module was built ever answered the endpoint with anything but a refusal, so the success path has no recordable fixture and therefore no executable read-back. The landed code, its request and its refusal handling are unaffected — the drop is about the PROOF.

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);
declare function renderUsagePanel(usage: unknown): void;

// ❌ Wrong — assumes a populated usage panel exists to render
const { data } = stats.useContext();
renderUsagePanel(data.value.usage); // undefined on every reachable branch today

// ✅ Correct — render the proven state, and treat the rest as not-yet-proven
const { isUsageVisible, hasUsageError } = stats.useMeta();
// isUsageVisible is true only after a SUCCESSFUL settled read — unreachable today.
// hasUsageError / the refusal is the only state a consumer can actually drive to.
```

**Test scenario:** Sign in as any client account available to you, call `useStats().as('client')`, await `isUsageReady()`, and assert `hasUsageError` is `true` and `isUsageVisible` is `false`. Do not write a test that asserts a populated usage panel — there is no account that reaches it.

---

## 2. A tile's `null` is not a zero, and a zero is not a `null` 🧪

None of the four stat tiles collapses "the platform had nothing to report for this window" into `0`, and none promotes a real `0` into an absent value.

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);
const { data } = stats.useContext();

// ❌ Wrong — treats null and 0 as interchangeable
const wrongLabel = data.value.totalOrders || "No orders yet";
// A GENUINE zero-order account renders "No orders yet" — indistinguishable from "no data"

// ✅ Correct — branch on null specifically
const label =
  data.value.totalOrders === null ? "—" : String(data.value.totalOrders);
```

**Test scenario:** Record a fixture where a currency-bound report's result carries no `"ALL"` key at all (rather than an `"ALL"` key with `count: 0`), and assert the tile reads `null`, not `0`.

---

## 3. Naming `report` or `invoice_status` as an array crashes the request, not just this module

If you ever build a request against `GET api/stats` outside this module's own `stats.utils.ts` parameter bags, do not let a generic query-serialisation helper turn `report: ["total"]` into a repeated `report[]=total` query key. The endpoint answers with a server error, not a validation error, for the repeated-key form — it expects the whole array serialised as one JSON-array-shaped string value.

```typescript
declare function buildQuery(params: Record<string, unknown>): string;

// ❌ Wrong — a generic array-param serialiser produces report[]=total
buildQuery({ report: ["total"] });

// ✅ Correct — the module's own bracketed() helper
JSON.stringify(["total"]); // '["total"]', sent as ONE string query value
```

---

## 4. The usage flags are NOT the tiles' flags 🧪

`isLoading`, `hasError` and `isEmpty` cover the four tiles ONLY. The usage read answers to `isLoadingUsage`, `hasUsageError` and `isUsageVisible`, and its data and error are `data.usage` and `usageError`.

This is not cosmetic. The usage read is gated on the Upmind host context (a hostname allowlist read from `VITE_APP_UPMIND_HOSTNAMES`, never a field on the client record) and the tile reads are not. Off that allowlist the usage query never fetches, so:

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);
const { isLoading, isLoadingUsage } = stats.useMeta();
declare function renderUsageSpinner(): void;

// ❌ Wrong — reads the tiles' flag and calls it the usage block's
if (isLoading.value) renderUsageSpinner();

// ✅ Correct — the usage block has its own, and it closes with the gate
if (isLoadingUsage.value) renderUsageSpinner();
```

`isLoadingUsage` reads `false` off the allowlist precisely because nothing will ever load. A flag derived from the query's own `isFetched` alone would pin the consumer to a spinner for good.

**Test scenario:** Point the hostname off the `VITE_APP_UPMIND_HOSTNAMES` allowlist, drive `useStats`, and assert that no `upmind_usage` request reaches the wire while the four tiles still answer — and that `isLoadingUsage` is `false`, not `true`.

---

## 5. `isEmpty` is "none of the four holds a number", not "the account has nothing"

`isEmpty` reads the same normalised counts `useContext` publishes (the query core's `[]` fallback on an unresolved branch becomes `null` before the absence test), so an unresolved count is absent and a real `0` is a number. It reads `true` only while none of the four counts holds a number and no read has failed.

A real zero among real numbers is therefore NOT an empty account — a client with zero open tickets and a non-zero order count reads `isEmpty === false`. A failed read reads `false` too: `isEmpty` is never a stand-in for `hasError`.

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);
const { data } = stats.useContext();
const { isEmpty } = stats.useMeta();

// ❌ Wrong — treats a zero as an empty account
const wrongWelcome = data.value.totalOrders === 0;

// ✅ Correct — ask the flag; it separates absence from a real zero
const showWelcome = isEmpty.value;
```

**Test scenario:** Sign in as an account whose tickets read answers a real `0` while the other counts hold numbers, and assert `isEmpty` is `false`. The `true` state needs a client for whom all four reads answer with no report at all; none of the recorded accounts is one, so only the `false` side is proven against a recording.

---

## 6. The active-tickets tile fails OPEN, not closed

If the brand-config read behind the tickets tile's visibility gate fails, the tile **stays visible** — this is the opposite default to most other visibility gates in the codebase, which fail closed (hide on a broken read).

> **For Internal Devs:** `hasVisibilityError` is published alongside `isVisible` specifically so a consumer CAN tell "hidden because the brand disabled it" from "shown because the gate read is broken" — check both flags if your UI needs to distinguish the two, rather than assuming `isVisible === true` always means a healthy read.

---

## Common Mistakes

### Assuming the usage panel's data shape from the legacy admin dashboard

The legacy dashboard's usage panel renders eleven distinct usage figures and a quota-comparison grid. None of that is reproduced here — `useStats().useContext().data.value.usage` is `undefined` on every reachable branch. Do not port field names or shapes from the legacy panel into code that reads this composable; that half is a signed drop, and there is nothing there yet.

### Reaching for `.for('client', someOtherId)`

The scope matrix declares `SELF` alone, so `.for()` is refused for every actor, including `client`. This is a compile-time error, not a runtime guard — if you find yourself trying to work around it, the capability you want does not exist in this module.

### Sending a currency code on the tickets read

The tickets tile has no currency dimension. Passing a `currency_code` parameter on that specific read is not part of its contract — the other three tiles pin `currency_code=ALL`, but the tickets read never sends the parameter at all.

---

## Edge Cases

| Scenario | Expected Behavior | Notes |
| --- | --- | --- |
| No authenticated session | No request is issued at all | `isAvailable` reads `false`; a forced `refresh()` or `refreshUsage()` rejects rather than reaching the network |
| Host outside the `VITE_APP_UPMIND_HOSTNAMES` allowlist | The four tiles read normally; the usage read never fires | `isLoadingUsage` and `isUsageVisible` both read `false`, with no round trip |
| A currency-bound report's window has nothing to report | The report key itself reads `null` on the wire | Distinct wire shape from "no matching currency key" — both normalise to the SAME published `null` |
| The tickets report's requested key is entirely absent from the response | Reads `null` (defensive) | Not observed in any capture; the module still handles it |
| Brand support-system setting explicitly disabled | `isVisible` reads `false` for the tickets tile | The one gate on the tiles that fails CLOSED |
| Brand config read itself fails | `isVisible` still reads `true`; `hasVisibilityError` reads `true` | Fails OPEN — see gotcha 6 |

---

## Lifecycle Considerations

### Destroy the Instance When Done

If creating the composable in a component, destroy it on unmount to remove it from the registry. `destroy()` is SHARED — one call covers both concerns, because one scope backs them:

```typescript
import { onUnmounted } from "vue";
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

onUnmounted(() => stats.useActions().destroy());
```

### Wait for Ready State

Before rendering, wait for the composable to settle — it always resolves, even when the session settles without an addressable client:

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

const ready = await stats.useActions().isReady(); // false if never addressable
const usageReady = await stats.useActions().isUsageReady(); // false off the allowlist too
```

### `reset()` drops cached data — it does not refetch

`reset()` clears the cached counts for the scope; it does not itself issue a new request. Follow it with `refresh()` if you need a fresh read immediately. The usage read has its own pair, `resetUsage()` and `refreshUsage()` — `reset()` never drops it.
