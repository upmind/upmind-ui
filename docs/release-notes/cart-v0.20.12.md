# Release Notes — Cart v0.20.12

> Domain search can now be filtered to specific extensions from a link, plus a fix for products being added to the basket by accident.

## ✨ New Features

### Filter domain search by extension
Brands can now link into the cart with a `tlds` parameter and the domain search will only suggest those extensions. A landing page promoting `.tech` can send customers to `?tlds=tech` and every suggestion comes back `.tech`, rather than the usual spread across the brand's whole TLD list.

The filter stays on the URL rather than being consumed, so it survives a refresh, a shared link, and the hop from the domain search through add-to-basket and on to the next step. It applies to both the standard and smart-suggest search flows, so the filter works on every brand. The exact domain a customer types is always offered regardless of the filter — only the suggestions alongside it are narrowed.

**Sending customers to the domains page:**

```text
https://your-storefront.com/order/domains/?tlds=tech
```

**Sending customers to a product that needs a domain**, running the domain funnel first — customers pick their `.tech` domain, then continue to the product:

```text
https://your-storefront.com/?pid=<product-id>&funnel=domains&tlds=tech
```

**Offering several extensions** — list them comma-separated, or repeat the parameter. Both forms work on either link above:

```text
?tlds=tech,co.uk
?tlds=tech&tlds=co.uk
```

Write extensions as bare labels without a leading dot (`tech`, not `.tech`). A leading dot is tolerated if one slips in, as is stray whitespace, and multi-part extensions like `co.uk` keep their inner dot.

## 🐛 Bug Fixes

### Product titles and images no longer add to the basket
On brands with product auto-update enabled, clicking a product's title or image — which should simply open that product to configure it — added the product straight to the basket instead. Navigation links now say explicitly that they are only navigating, so the basket is only touched by a deliberate add action. Brands without auto-update enabled are unaffected, and the add buttons themselves behave exactly as before.

## 🔧 Under the hood

- Domain suggestion results are cached against the extension filter, so a previously cached unfiltered result set is never served for a filtered search. Filters listing the same extensions in a different order share one cache entry.
- End-to-end coverage for the extension filter across the full domain funnel — entry, suggestions, add-to-basket and continue.

---

*Hotfix on top of v0.20.11. References: FE-3077.*
