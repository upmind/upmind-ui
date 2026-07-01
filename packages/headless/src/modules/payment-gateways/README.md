# PAYMENT GATEWAYS

## Context

Payment gateways can have one of 2 contexts:

1. Pay - Generally used in the course of paying for an invoice and will generally require an amount, currency and other payment details.
2. Add - Generally used for adding a new payment method. This is then in turn stored against the client via our API posting to our `payment_details` endpoint.

## Processing

Payment Gateways can also be processed in a number of ways:

- via their _own SDK_, which would generally require a custom Machine to handle the unique requirements by each gateway. eg :Stripe
- via an _offsite redirect_ where the user is redirected to the payment gateway's website to complete the payment and once complete/failed then redirects back to our app
- via a legacy _checkout_ where the user enters their payment details directly via a form into our app and we handle the payment processing in the background. This is DEPRECATED as PCI compliance is a concern.
- via a _stored payment_ method, where the user's payment details have been previously added/stored as a token and can be used for future transactions without requiring the user to re-enter their information.
- via a _manual/offline payment_ method, where the user makes their payment offline and informs our system/support team of the payment. eg: Bank Transfer
- via a _free_ payment gateway where no payment is required either because of the item being free OR discounts being applied.

## Machines & Operations

Gateways are spawned from the Payment details machine. Users would generally select the payment gateway they want to use and the payment details machine would then spawn the appropriate gateway.

Most gateways would use the generic machine, as they are designed to handle a wide variety of payment scenarios and can be easily configured to work with different payment providers. Usually offsite.

However if a gateway has a specialised implementation, or SDK or an obscurity, then we tend to create a custom gateway machine. This machine would have mostly similar flow and services, but can accommodate the unique requirements of the gateway.

Occasionally a gateway may be offsite and asynchronous, such as adding a stripe payment context. This is rare but does happen, where the sdk bypasses our API, and handles the redirect to the payment gateway and then back to our app. This means our back end does not necessarily have the context it needs to be able to process the payment detail.
We leverage url query params heavily for this process as we need to 'store' our context that started the process with the response that the gateway gives us via query params as well.

GOTCHA #2: This can clutter the url and there is a limit to the length of the url.To overcome this we leverage local storage and store our context there as a stringified JSON object.
GOTCHA #1:Some browsers/users disable session storage.vWe need to check that and ensure we use a2b hashed `operation` query params when session storage is not available.

To make this process cleaner, the idea is that at the point of handing off to the external process, we persist the current gateway machine into session storage using the gateway id as the key. Upon returning, we can retrieve the machine from storage and rehydrate it with the context from the query params and send the action to the machine to complete the process.

if we dont have storage, we then leverage the `operation` query param . The `operation` params will contain all the necessary context to spawn the correct gateway machine with context and put it into the correct state to complete the process.

### Custom Gateways

- [ ] Stripe
  - [x] Pay
  - [ ] Add
- [ ] External store gateway
  - [ ] Add
- [ ] Open pay
- [ ] Braintree
- [ ] Mercado pargo
- [ ] Mobile
- [ ]

---
