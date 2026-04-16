# Release Notes — Cart v0.17.1

> Hotfix release addressing checkout, payment, and layout issues introduced in v0.17.0.

## 🐛 Bug Fixes

### Faster payment method switching at checkout
Switching between payment methods (e.g. card → bank transfer) is now instant. Previously, this could take up to a second due to unnecessary API calls running in the background before the UI updated.

### Account credit now correctly covers the order balance
When your account credit fully covers an order, the checkout now correctly hides payment gateway options and processes the order using your credit. Previously, payment gateways were still shown even when credit covered the full amount, which could lead to double-charge confusion and navigation issues after payment.

### Navigation links restored at checkout when billing details are disabled
The brand logo and basket icon links now work correctly at checkout when billing details collection is turned off. Previously, clicking these links would update the URL but fail to navigate to the new page.

### Product term prices now display correctly
The term selector on product cards and in the basket now respects your configured price display setting (monthly vs full term). Previously, the basket term selector always showed the full term price regardless of your brand's display preference, while product cards did the opposite — creating an inconsistent experience.

### Page layouts no longer incorrectly constrained
A width constraint intended only for the billing page was accidentally applied to all pages, causing elements like the domain search input to render narrower than intended. Each page now displays at its intended width.

## 📋 Other

### Basket product API endpoint restored
An API endpoint for basket products that was inadvertently removed has been reinstated.

---

*6 fixes in this release across checkout, payments, product pricing, and layout.*
