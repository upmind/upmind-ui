# ADR-019: Generic Product Setup Flow Over Domain-Specific Registrant

**Status:** Accepted  
**Date:** 2026-04-23  
**Story:** FE-2457

## Context

FE-2457 originally specified a domain-specific "registrant details" flow where users would manually enter billing/contact details for domain products. This was designed to populate provision fields (registrant name, address, etc.) required for domain registration.

During implementation, a key change occurred: **the backend now auto-populates domain provision fields from billing details**. This means the domain-specific UI for entering registrant details is no longer necessary.

However, we still need a mechanism to handle ANY product (not just domains) that has invalid or incomplete provision fields before checkout.

## Decision

Replace the domain-specific registrant flow with a **generic "Product Setup" flow** that:

1. Works for ANY product type with invalid/missing provision fields
2. Shows ONE product at a time with only the fields that need attention
3. Allows users to optionally apply values to similar products
4. Merges data without overwriting existing values

### Key Technical Choices

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Composable** | New `useProductSetup` composable | Clean implementation for product setup flow |
| **Route** | `PRODUCT_SETUP` | Clear naming for the flow |
| **UISchema filtering** | Filter UISchema only, not JSON Schema | JSONForms renders from UISchema; simpler approach |
| **Merge logic** | `defaultsDeep` - existing values preserved | Never override user-entered data |
| **Skip option** | Removed | Must fix all invalid products before checkout |

### What Gets Removed

The never-shipped domain registrant implementation:
- `packages/headless/src/modules/domainRegistrant/`
- `packages/client-vue/src/modules/domain-registrant/`
- Domain-specific routes (`DOMAIN_REGISTRANT`, `DOMAIN_REGISTRANT_EDIT`)
- Domain-specific guards (`hasInvalidDomains`, `hasDomainProducts`, `isRegistrantComplete`)

## Consequences

### Positive

- **Generic solution** - Works for any product type, not just domains
- **Simpler UX** - Shows only fields that need attention, not entire forms
- **Less code** - Removes domain-specific module, extends existing composable
- **Future-proof** - New product types automatically benefit from the flow
- **Consistent with BE** - Billing auto-population handled server-side

### Negative

- **Lost domain-specific optimizations** - Can't tailor UI specifically for domain registrants
- **Checkbox list complexity** - User must decide which products to apply values to (mitigated by opt-in design)

### Neutral

- **Config-driven behavior** - `@context productSetup` controls whether to show deferred products (valid but incomplete)

## Alternatives Considered

### 1. Keep Domain-Specific Flow + Add Generic Flow

Rejected because:
- Duplicated infrastructure
- Domain flow is now redundant (BE handles billing → provision mapping)
- Maintenance burden of two similar flows

### 2. No Attention Flow (Just Block at Checkout)

Rejected because:
- Poor UX - user doesn't know which fields are missing
- No guidance on how to fix issues
- Can't apply values to multiple products

### 3. Auto-Apply to All Matching Products

Rejected because:
- Could override user-intentional differences between products
- Less control for users with multiple products
- Opt-in checkbox approach is safer

## References

- SDD: `docs/sdd/FE-2457/design.md`
- Original issue: FE-2457
- Related: FE-2400 (Standalone Billing Details Page)
