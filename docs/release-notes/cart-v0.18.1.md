# Release Notes — Cart v0.18.1

> A smarter domain search experience, inline formatting in product descriptions, image carousel improvements, and a batch of availability, security and resilience fixes.

## ✨ New Features

### Smarter domain search
The domain search field has been reworked around a new state-driven flow, making domain look-up and selection more responsive and predictable as customers type.

### Inline formatting in product descriptions
Product card descriptions can now include inline formatting — bold, links and the like — rendered safely as inline-only markdown, so brands can add light emphasis without disturbing the card layout.

### Image carousel improvements
Product image carousels have been polished for smoother, more reliable browsing.

## 🐛 Bug Fixes

### Hardened sign-in transfer links
Sign-in transfer links now reject unsafe redirect targets, closing a potential cross-site scripting vector.

### Domain search drawer opens reliably
On slower connections the domain search drawer could fail to open the first time it was needed. It now opens consistently regardless of connection speed.

### Unavailable products detected more precisely
Product availability is now judged strictly — only genuinely unavailable products show the unavailable state and disabled add-to-basket action, avoiding false positives across the catalogue, recommendations and configuration.

### Unreachable storefronts redirect cleanly
When a storefront's brand can't be resolved, customers are now sent to the platform URL instead of hitting an error page — and the redirect happens immediately rather than after several pointless retries.

### Billing term retained when changing options
Adjusting a product's options could leave a stale or empty billing term selected. The correct term is now kept.

## 🔧 Under the hood

- Replaced the bespoke required-option defaulting with the standard schema/parse pipeline, removing duplicated configuration logic.
- Code-quality cleanup following the WOM-78 split-endpoints review.

---

*Highlights across domain search, product presentation, image carousels, availability handling, sign-in security and storefront resilience. References: FE-2539, FE-2714, FE-2699, FE-2786, FE-2706, FE-2777, FE-2703, FE-2554.*
