# Release Notes — Cart v0.17.0

> A feature-packed release bringing new payment methods, inline product editing, custom pricing, improved two-factor authentication, and dozens of bug fixes.

## ✨ New Features

### Inline Product Editing in Basket
You can now edit product options — such as billing term and configuration settings — directly from the basket without navigating away. Changes are saved automatically, making it faster to adjust your order.

### Custom and Adjusted Pricing
Cart 2.0 now supports the existing admin feature for setting custom prices on individual product configuration settings (billing terms, product options, and attributes). When a custom price is applied, a "Custom price" badge appears alongside the original and adjusted prices, so you always know what's been changed.

> *Note: This feature may be deferred to a future release pending a backend dependency.*

### Client Area Templates
Cart 2.0 now fully supports client area templates — the existing feature that lets brands inject custom content (marketing messages, help text, trust badges) into dedicated slots across basket, checkout, and authentication pages.

### Mercado Pago Payments
Full support for Mercado Pago card payments across Argentina, Brazil, Chile, Colombia, Mexico, Peru, and Uruguay, plus additional payment methods like OXXO, Paycash, and boleto.

### DLocal Card Payments
Added support for DLocal card tokenisation, enabling card payments across Latin America and other emerging markets.

### Zero-Value Basket Payment Support
Cart 2.0 now supports the BOS (Business Operating System) setting that requires a stored payment method even when the basket total is zero. This enables scenarios like free trials that need a card on file for future billing.

### Two-Factor Authentication Modal
Two-factor authentication now opens in a clean modal overlay instead of replacing the login form. The new flow includes an animated icon, clear instructions, and the ability to cancel without losing your credentials.

## 🔧 Improvements

### Billing Page Sticky Footer
The confirm button on the billing page now stays visible in a sticky footer, so you don't have to scroll to the bottom when you have many addresses or companies.

### Payment Term Descriptions
Product terms now respect the "Payment term descriptions" brand setting, giving you more control over how billing terms are displayed to customers.

### Term Selector in Basket Shows Pricing
When changing a product's billing term from the basket, you can now see promotions and pricing directly in the term selector dropdown.

### Subproduct Card Pricing Improvements
Configuration subproduct cards now show a "+" prefix for the regular price when a current (discounted) price is also displayed, making it clearer which price is the add-on cost.

### Recommendations Carousel
- The carousel no longer allows dragging when all items fit on screen
- Navigation arrows no longer overflow on mobile devices
- Product benefits are now correctly displayed on recommendation cards

### Product Quantity Price Recalculation
Increasing product quantity now correctly triggers a price recalculation, keeping your totals accurate as you adjust quantities.



### Payment Gateway Loading
Payment gateways now show a proper loading state instead of briefly flashing the payment button or "Nothing to pay" message while loading.

## 🐛 Bug Fixes

### Checkout & Payment
- **Payment gateway currency filtering**: Gateways are now correctly hidden when they're not configured for the selected currency
- **Non-storable payment method messaging**: Improved messaging when attempting to save a payment method that the gateway doesn't support for storage

### Pricing & Display
- **Free trial currency**: Free trial products now display the "usual" price in the correct currency when you've switched from the default
- **Free trial custom price badge**: The "Custom price" badge no longer incorrectly appears when editing a free trial product
- **Promotional pricing on free trials**: Promo codes now correctly show discounted pricing and badges on free trial products

### Basket & Products
- **Action required messaging**: Completing required product fields (e.g. domain for hosting) now correctly removes the "action required" notification from the basket item

### Navigation & Stability
- **Billing page without basket**: Navigating directly to the billing page without an active basket no longer causes the site to hang indefinitely
- **Page crash on quick navigation**: Fixed a crash that could occur on some browsers when navigating between pages rapidly
- **Authentication error handling**: Guest users no longer trigger unnecessary error events when browsing without a session

### Data Quality
- **Tracking data**: Fixed a bug where analytics tracking payloads included an extra malformed property, improving data accuracy for UTM tracking

---

*28 changes in this release across payments, product configuration, basket, checkout, authentication, and recommendations.*
