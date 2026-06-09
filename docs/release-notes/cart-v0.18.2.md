# Release Notes — Cart v0.18.2

> Guest checkout, plus the option to require email verification before an order is placed.

## ✨ New Features

### Guest checkout
Customers can now complete a purchase without creating a full account, where the brand allows it. A "Continue as guest" option is offered on the sign-in / register screens whenever guest checkout is enabled on the brand and the basket contains only one-time products (recurring products still require a full account). Guests can optionally provide an email for the receipt, and can upgrade to a full account at any point — before or after placing the order — keeping their order history attached.

### Enforce email verification at checkout
Brands can now require unverified customers to confirm their email address before an order can be placed. When the setting is enabled, customers signing in with an unverified email are taken to a short verification step that accepts the 6-digit code from their inbox, with the option to resend the code or return to the basket and pick up later. Once verified, checkout continues as normal; if the setting is off, nothing changes for the customer.

## 🐛 Bug Fixes

### Adjust-credit modal can now be closed
The X (close) button on the "adjust credit amount" modal had stopped responding, leaving customers having to navigate away to dismiss it. The close button now works again.

### Clearer label on the register form
The register form's identifier field was labelled "Your username or email address" even though it only accepts an email. The label is now simply "Your email".

## 🔧 Under the hood

- Introduced a named-route overlay pattern so modals, drawers and interstitials (like the new email-verification step) can be triggered from any route without each needing a dedicated page.

---

*Hotfix on top of v0.18.1. References: FE-1035, FE-1329, FE-1365, FE-2816, FE-2817.*
