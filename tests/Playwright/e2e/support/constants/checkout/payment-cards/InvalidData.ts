export const ErrorCards = [
  {
    name: "Invalid Card Number",
    cardNumber: "4242424242424241",
    expiryDate: "12/50",
    cvcCode: "123",
    errorText: "Your card number is invalid."
  },
  {
    name: "Invalid Expiry Year",
    cardNumber: "4242424242424242",
    expiryDate: "12/95",
    cvcCode: "123",
    errorText: "Your card’s expiration year is invalid."
  },
  {
    // No errorText: Stripe shows the incomplete-CVC message only after the
    // field blurs, so the spec asserts the refusal (Place Order disabled) alone.
    name: "Invalid CVC",
    cardNumber: "4242424242424242",
    expiryDate: "12/50",
    cvcCode: "99",
    errorText: ""
  }
];
