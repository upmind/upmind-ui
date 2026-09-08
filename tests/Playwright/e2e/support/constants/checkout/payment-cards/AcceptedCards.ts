export const AcceptedCards = [
  {
    name: "Visa",
    cardNumber: "4242424242424242",
    expiryDate: "12/50",
    cvcCode: "123"
  },
  {
    name: "Mastercard",
    cardNumber: "5555555555554444",
    expiryDate: "12/50",
    cvcCode: "123"
  },
  {
    name: "Amex",
    cardNumber: "378282246310005",
    expiryDate: "12/50",
    cvcCode: "123"
  },
  {
    name: "Discover",
    cardNumber: "6011111111111117",
    expiryDate: "12/50",
    cvcCode: "123"
  }
  // No DinersClub: this Stripe account declines it, and the case only ever
  // passed by carrying the Amex number.
];
