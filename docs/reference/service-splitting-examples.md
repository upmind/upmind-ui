# Service Splitting — Worked Examples

Reference appendix for the `code-services.md` rule (`.agent/rules/code-services.md`). The rule carries the decision criteria, the three implementation patterns, and the review checklist; this doc holds the worked real-world examples, the decision flowchart, and the summary table that illustrate them.

> **Reference Implementation:** `packages/headless/src/modules/auth/` demonstrates the full split pattern.

---

## Real-World Examples

### Example 1: Client Emails (SPLIT)

**Decision:** ✅ Yes - Different endpoints

| Actor | Endpoint | Reason |
|-------|----------|--------|
| Client | `/client/emails` | Client's own emails |
| Staff | `/admin/clients/{id}/emails` | Emails for specific client |

**Implementation:**

```typescript
// emails.services.client.ts
async function getEmails(): Promise<Email[]> {
  return get({ url: useUrl("client/emails") });
}

// emails.services.staff.ts
async function getEmails(clientId: string): Promise<Email[]> {
  return get({ url: useUrl(`admin/clients/${clientId}/emails`) });
}
```

---

### Example 2: Invoices (SPLIT)

**Decision:** ✅ Yes - Different endpoints + permissions

| Actor | Endpoint | Capabilities |
|-------|----------|--------------|
| Client | `/client/invoices` | View own invoices, pay |
| Staff | `/admin/clients/{id}/invoices` | View any client's invoices, void, adjust |

**Implementation:**

```typescript
// invoices.services.client.ts
async function getInvoices(): Promise<Invoice[]> {
  return get({ url: useUrl("client/invoices") });
}

async function payInvoice(invoiceId: string): Promise<void> {
  return post({ url: useUrl(`client/invoices/${invoiceId}/pay`) });
}

// invoices.services.staff.ts
async function getInvoices(clientId: string): Promise<Invoice[]> {
  return get({ url: useUrl(`admin/clients/${clientId}/invoices`) });
}

async function voidInvoice(clientId: string, invoiceId: string, reason: string): Promise<void> {
  return post({
    url: useUrl(`admin/clients/${clientId}/invoices/${invoiceId}/void`),
    data: { reason }
  });
}
```

---

### Example 3: Basket (MAYBE SPLIT)

**Decision:** 🟡 Maybe - Same endpoint, different claim flow

| Actor | Endpoint | Behavior |
|-------|----------|----------|
| Client | `/baskets` | Can claim abandoned baskets |
| Staff | `/baskets` | Always creates new basket for client |

**Option A: Split (if claim logic is complex)**

```typescript
// basket.services.client.ts
async function loadBasket(): Promise<Basket> {
  const existing = await checkForClaimableBasket();
  if (existing) {
    return claimBasket(existing.id);
  }
  return createBasket();
}

// basket.services.staff.ts
async function loadBasket(clientId: string): Promise<Basket> {
  return createBasketForClient(clientId);
}
```

**Option B: No split (if claim logic is simple)**

```typescript
// basket.services.ts
async function loadBasket(actor: AccessRoleTypes, clientId?: string): Promise<Basket> {
  if (actor === AccessRoleTypes.CLIENT) {
    const existing = await checkForClaimableBasket();
    if (existing) return claimBasket(existing.id);
  }

  return actor === AccessRoleTypes.STAFF && clientId
    ? createBasketForClient(clientId)
    : createBasket();
}
```

**Recommendation:** Start with Option B (no split). Split only if claim logic grows complex.

---

### Example 4: Product Catalogue (NO SPLIT)

**Decision:** ❌ No - Same endpoint, server-side filtering

| Actor | Endpoint | Result |
|-------|----------|--------|
| Client | `/products` | Published products only |
| Staff | `/products` | All products (including drafts) |

**Implementation:**

```typescript
// products.services.ts
async function getProducts(): Promise<Product[]> {
  return get({ url: useUrl("products") });
  // Server automatically filters by actor permissions
}
```

---

### Example 5: Brand Config (NO SPLIT)

**Decision:** ❌ No - Same endpoint, same data

| Actor | Endpoint | Result |
|-------|----------|--------|
| All | `/brand/config` | Identical config |

**Implementation:**

```typescript
// brand.services.ts
async function getBrandConfig(): Promise<BrandConfig> {
  return get({ url: useUrl("brand/config") });
}
```

---

## Decision Flowchart

```
Start
  │
  ├─ Different API endpoints? ────────── Yes ──→ SPLIT
  │                                       │
  ├─ Different grant types? ──────────── Yes ──→ SPLIT
  │                                       │
  ├─ Different response shapes? ───────── Yes ──→ SPLIT
  │                                       │
  ├─ Different business logic? ────────── Yes ──→ SPLIT
  │                                       │
  ├─ Complex permission differences? ──── Yes ──→ MAYBE SPLIT (evaluate)
  │                                       │
  ├─ Same endpoint + server filtering? ── Yes ──→ NO SPLIT
  │                                       │
  └─ Same everything? ──────────────────── Yes ──→ NO SPLIT
```

---

## Summary Table

| Feature | Client Endpoint | Staff Endpoint | Split? | Reason |
|---------|----------------|----------------|--------|--------|
| **Auth** | `/access_token` (PASSWORD) | `/access_token` (ADMIN) | ✅ Yes | Different grant types + 2FA flows + registration logic |
| **Client Emails** | `/client/emails` | `/admin/clients/{id}/emails` | ✅ Yes | Different endpoints |
| **Invoices** | `/client/invoices` | `/admin/clients/{id}/invoices` | ✅ Yes | Different endpoints + permissions |
| **Basket** | `/baskets` | `/baskets` | 🟡 Maybe | Same endpoint, but claim flow differs - evaluate complexity |
| **Product Catalogue** | `/products` | `/products` | ❌ No | Same endpoint, server-side filtering |
| **Brand Config** | `/brand/config` | `/brand/config` | ❌ No | Same endpoint, same data |

---

## Further Reading

- [`.agent/rules/code-services.md`](/.agent/rules/code-services.md) — Service-actor authoring + split decision criteria
- [`.agent/rules/code-composables-scoped.md`](/.agent/rules/code-composables-scoped.md) — How to structure scoped composables
- [Auth Module](/packages/headless/src/modules/auth/) — Reference implementation
