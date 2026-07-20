export const ThreeDSecureCards = [
  {
    name: "Authenticate unless set up",
    cardNumber: "4000002500003155",
    expiryDate: "12/50",
    cvcCode: "123",
    // Authenticates then charges → the order confirmation renders.
    declines: false
  },
  {
    name: "Always authenticate",
    cardNumber: "4000002760003184",
    expiryDate: "12/50",
    cvcCode: "123",
    declines: false
  },
  {
    name: "Already set up",
    cardNumber: "4000003800000446",
    expiryDate: "12/50",
    cvcCode: "123",
    declines: false
  },
  {
    name: "Insufficient funds",
    cardNumber: "4000008260003178",
    expiryDate: "12/50",
    cvcCode: "123",
    // Authenticates then declines → the confirmation shows the failed alert.
    declines: true
  }
];
