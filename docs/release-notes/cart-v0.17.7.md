# Release Notes — Cart v0.17.7

> Hotfix release with checkout reliability fixes, a redesigned basket, and smarter recommendations.

## 🐛 Bug Fixes

### Stripe "amount too small" errors now shown to the customer
If a customer entered a pay-amount below Stripe's minimum (e.g. £0.20 on a USD gateway), the payment would silently fail with no feedback. The actual Stripe error is now surfaced so the customer can correct the amount and proceed.

### Two-factor authentication modal now closes after too many attempts
When a user exceeded the maximum 2FA attempts from the login popover, the "Too many attempts" message appeared but the 2FA modal stayed open behind it. The modal now dismisses automatically when the user navigates away.

### Catalogue setting for in-situ adding is now honoured
When a product didn't need configuration, the catalogue was still navigating customers to a config page instead of adding the item directly to the basket. Products without configurable options now add in place, keeping the customer on the catalogue.

### Recommendations now load correctly regardless of subproduct format
Recommendations that bundle subproducts could fail to pre-select them depending on how the IDs were returned by the API (array, single value, or comma-separated string). All three formats are now handled.

## 🔧 Improvements

### Faster basket refreshes
Basket refreshes triggered by currency changes, promo codes, or billing updates no longer re-fetch provisioning data for every product. The extra API calls now only run when products actually change, making the basket noticeably snappier when applying discounts or switching currency.

### Cart warnings consolidated into a single dismissable banner
Warning notifications on the basket and checkout previously appeared as separate popups that had to be dismissed one by one. They're now grouped into a single banner with one line per warning, and the whole banner can be dismissed in one click.

### Refreshed basket product card design
Product cards and upsell tiles in the basket have been updated to match the latest design system, with improved spacing, typography, and visual hierarchy.

## ✨ New Features

### Smarter recommendations — no more duplicate suggestions
Recommendations now check the full product ID (not just product option IDs) before displaying. Products already in the customer's basket won't be recommended again, even if they were added with different options. Brands can configure whether matching is done at the product level or the full-configuration level.

### Conditional rules for context settings
`@context` settings can now resolve dynamically based on what's in the basket. Brands can express rules like "use this value unless the basket contains a domain" or "show this upsell only when the order total exceeds X" — using a declarative `{ default, rules }` syntax that evaluates against product, item, and basket state.

---

*9 changes in this release across checkout, payments, basket, recommendations, and brand configuration.*
