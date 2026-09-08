# Invoices Gotchas

Edge cases and things to watch out for.

> **🧪 For Testers:** focus on the 🧪 items.

---

## Read meta only after isReady() 🧪

Before the fetch settles, the query default for `data` is `[]`, and `meta` derives
from a loaded invoice. Reading `meta` on a non-loaded invoice observes the pre-load
default, not the invoice.

```typescript
// ❌ Wrong — reads before the invoice has loaded
const { meta } = useInvoice(id);
if (meta.value.isPaid) settle();

// ✅ Correct — wait for readiness first
const invoice = useInvoice(id);
await invoice.isReady();
if (invoice.meta.value.isPaid) settle();
```

**Test scenario:** mount a component, assert it awaits `isReady()` before branching on `meta`.

---

## invalidate() must match the query key 🧪

`invalidate()` drops the cached read only when its key matches the query's key. A
mismatched key silently drops nothing and no re-read fires, so a settled invoice keeps
showing a stale balance. (This was the FE-3130 bug — see the [changelog](./CHANGELOG.md).)

**Test scenario:** load an invoice, change the served body, call `invalidate()`, assert the next read returns the new balance.

---

## Payments include failures and pending rows

`data.payments` is append-only from the read side and includes declined, abandoned, and
pending attempts. Treat only captured, non-refunded rows as authoritative.

---

## A payment can carry no saved card

Wallet and one-off / guest-card captures return `cardType` and `cardLast4` as `null`.
Check presence before rendering "card ending 1234".

---

## The embedded client / address is frozen at conversion

The snapshot does not follow the live client record. Renames and address edits after
conversion do not appear on an existing invoice — correct for a legal document, but
wrong for a consumer that assumes it tracks the live record.

---

## Money fields come in three flavours

`unpaidAmount` (number), `unpaidAmountFormatted` (locale string), and
`unpaidAmountConverted` (display currency) are not interchangeable. Do arithmetic on the
number, render the formatted string, and never place a converted value beside a
non-converted total.

---

## Edge Cases

| Scenario                     | Expected behaviour                    | Notes                            |
| ---------------------------- | ------------------------------------- | -------------------------------- |
| Unauthenticated caller       | no request fired; invoice unavailable | guard rejects before the wire    |
| Unknown id                   | `404`; `error` populated              | `meta.hasError` after load       |
| No payments, balance owed    | `isPending` true                      | fresh unpaid invoice             |
| Payments, nothing owed       | `isPaid` true                         | settled                          |
| Pending (uncaptured) attempt | contributes nothing to `paidAmount`   | do not re-prompt while in flight |

---

## Lifecycle

There is no `destroy()` — the module holds no long-lived service. Await readiness before
reading:

```typescript
await useInvoice(id).isReady();
```
