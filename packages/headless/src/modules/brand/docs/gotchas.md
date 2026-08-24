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

```typescript
// Wrong - treats as boolean
const showGross = brand.tax_type === 1;

// Correct - handles all three states
const taxBehaviour = {
  0: "net",
  1: "gross-recalc",
  2: "gross-fixed"
}[brand.tax_type];
```

**Test scenario:** Configure a brand with `tax_type: 1`, add a client with non-default tax rate, verify checkout total recalculates.

---

## Currency Expand Can Return Null

The `?with=currency` expand on `/brand/settings` can resolve to `null` even when the relation is configured.

```typescript
// Wrong - crashes on null expand
const code = brand.currency.code;

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

```typescript
// Wrong - only handles two cases
if (data.content) renderInline(data.content);
else redirect(data.url);

// Correct - handles null
if (!data) return null;
if (data.content) renderInline(data.content);
else if (data.url) redirect(data.url);
```

**Test scenario:** Load brand with no T&C configured, verify UI hides the T&C section instead of crashing.

---

## I18n Keys Use Dot Notation

The `meta.i18n` object uses dot-notation keys (e.g., `"cart.title"`). These are string keys, not nested paths.

```typescript
// Wrong - expects nested structure
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
