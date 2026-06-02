# Release Notes — Cart v0.18.0

> Introducing Product Setup, the ability to mark products as sold out, a smoother two-factor sign-in, and a batch of sign-in and layout fixes.

## ✨ New Features

### Complete missing product details before checkout
When something in the basket still needs information before it can be ordered — for example a domain that needs its registrant details — customers are now guided through a quick setup step. It walks through one product at a time, shows only the fields that still need filling in, and can optionally apply the same details to other matching products. Once everything's complete, checkout continues as normal.

### Mark products as sold out or unavailable
Brands can now flag a product as unavailable, and it will show a clear "unavailable" state across the catalogue and recommendations with the add-to-basket action disabled — so customers can't try to buy something that isn't available.

### Smoother two-factor sign-in
Two-factor codes now work with password managers and device autofill where appropriate, and entering an incorrect code no longer traps you in a loop — you can simply correct it and try again.

## 🐛 Bug Fixes

### Forgotten-password link no longer breaks sign-in
Clicking "Forgotten your password?" in the sign-in panel could break the page and require a refresh. It now works as expected.

### Sign-in pages no longer show a 404
Opening a sign-in page with a trailing slash in the address could show a "page not found" error. These links now load correctly either way.

### Returned to where you left off after signing in
Switching between Login, Register, and Reset Password could lose track of where you were heading, so after signing in you weren't taken back to checkout (or wherever you started). You're now reliably returned to your intended destination.

### Invalid billing-term links fall back to the default
Opening a product with an out-of-range billing period in the link (for example a term the product doesn't offer) left no term selected. It now falls back to the product's default term.

### Footer no longer pushed off-screen
On narrower and two-column layouts the footer could be pushed below the viewport. It now sits correctly within the page.

### Order processing screen restored during payment
The "processing" screen shown while an order is being placed had stopped appearing in some cases. It's now reliably displayed again.

---

*Highlights across product setup, catalogue availability, sign-in, two-factor, and layout. References: FE-2457, FE-2706, FE-2638, FE-2664, FE-2663, FE-2651, FE-2676.*
