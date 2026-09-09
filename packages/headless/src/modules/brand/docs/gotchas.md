# Brand Gotchas

Edge cases, known issues, and things to watch out for.

> **For Testers:** Focus on the test scenarios marked with below.

---

## Tax Inclusion Is Three-State

Tax handling is not a boolean. The `tax_type` field has three values:

| Value | Meaning                                 |
| ----- | --------------------------------------- |
| 0     | Exclude tax (prices net of tax)         |
| 1     | Include tax, recalculate per client tax |
| 2     | Include tax, ignore client tax          |

```ts
import { BrandTaxTypes } from "@upmind-automation/types";
import type { IBrandSettings } from "@upmind-automation/types";

declare const brand: IBrandSettings;

// Wrong - treats as boolean
const showGross = brand.tax_type === 1;

// Correct - handles all three states
const taxBehaviour = {
  [BrandTaxTypes.EXCLUDE_TAX]: "net",
  [BrandTaxTypes.INCLUDE_TAX_RESPECT_CLIENT_TAX]: "gross-recalc",
  [BrandTaxTypes.INCLUDE_TAX_IGNORE_CLIENT_TAX]: "gross-fixed"
}[brand.tax_type];
```

**Test scenario:** Configure a brand with `tax_type: 1`, add a client with non-default tax rate, verify checkout total recalculates.

---

## Currency Expand Can Return Null

The `?with=currency` expand on `/brand/settings` can resolve to `null` even when the relation is configured.

```ts
import type { IBrandSettings, ICurrency } from "@upmind-automation/types";

// The `currency` expand is not part of `IBrandSettings` — the typed contract
// carries only `currency_id` plus the supported `currencies` list.
declare const brand: IBrandSettings & { currency?: ICurrency | null };

// Wrong - crashes on null expand (strict TS refuses it too)
// @ts-expect-error `currency` is an optional expand, so it may be nullish
const wrongCode = brand.currency.code;

// Correct - fallback chain
const code =
  brand.currency?.code ??
  brand.currencies?.find(c => c.id === brand.currency_id)?.code ??
  brand.currencies?.find(c => c.base)?.code ??
  brand.currencies?.[0]?.code;
```

**Test scenario:** Load brand with configured default currency, verify currency code resolves even if the expand is missing.

---

## Terms and Conditions Has Three Shapes

`/terms_and_conditions/current` returns one of three shapes:

| Shape                | Condition         |
| -------------------- | ----------------- |
| `{ content: "..." }` | Embedded T&C      |
| `{ url: "..." }`     | Redirect T&C      |
| `data: null`         | No T&C configured |

```ts
import { useTermsAndConditions } from "@upmind-automation/headless";

declare function renderInline(content: string): void;
declare function redirect(url: string): void;

const { data } = useTermsAndConditions();

// Wrong - only handles two cases. `url` is optional on the mapped shape, and
// the "nothing configured" wire case (`data: null`) is not reflected in the
// composable's type at all — so nothing warns you it can be absent at runtime.
function renderTermsWrong() {
  const terms = data.value;
  if (terms.content) renderInline(terms.content);
  // @ts-expect-error `url` is optional, so it may be undefined
  else redirect(terms.url);
}

// Correct - handles the "nothing configured" case first
function renderTerms() {
  const terms = data.value;
  if (!terms) return null;
  if (terms.content) renderInline(terms.content);
  else if (terms.url) redirect(terms.url);
}
```

**Test scenario:** Load brand with no T&C configured, verify UI hides the T&C section instead of crashing.

---

## I18n Keys Use Dot Notation

The `meta.i18n` object uses dot-notation keys (e.g., `"cart.title"`). These are string keys, not nested paths.

```ts
import { expect } from "vitest";

// `meta.i18n` as it arrives: a locale map of flat, dot-notation string keys.
declare const i18n: Record<string, Record<string, string>> | undefined;

// Wrong - expects nested structure
// @ts-expect-error `cart` is not a nested object; the key is the literal "cart.title"
expect(i18n.en.cart.title).toBe("Cart");

// Correct - use bracket notation
expect(i18n?.en?.["cart.title"]).toBe("Cart");
```

---

## Common Mistakes

### Reading Brand Before It Settles

Consumers that read brand-derived values before brand resolves get defaults or empties. No error is thrown.

### Growing Key Sets Race

Each surface requests different config keys. An older response for a smaller key set can land after a newer response, causing keys to disappear from state.

---

## Edge Cases

| Scenario              | Expected Behavior                 | Notes                             |
| --------------------- | --------------------------------- | --------------------------------- |
| Unregistered origin   | Brand does not resolve            | Everything renders defaults       |
| Demo data flag set    | `demo_data_import_id` is non-null | Show demo-mode banner             |
| Zero-decimal currency | `decimals: false`                 | Do not display fractional amounts |

---

## Lifecycle Considerations

### Brand Is a Singleton

Brand is resolved once per storefront session. Do not create multiple instances.

### Downstream Invalidation

When brand identity changes (admin switch, domain mismatch), invalidate basket and product caches. They hold stale currency and policy values.
