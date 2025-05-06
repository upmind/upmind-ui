export const Meeting = [
  {
    name: "Billing Term: One-Time, Meeting Types: None @webcentral @meeting",
    radioSelection: [[0, 0]],
    checkboxSelection: [],
    total: "",
    billingCycle: "",
    consulting: "",
  },
  /* NO MEETING TYPE SELECTION */
  {
    name: "Billing Term: One-Time, Meeting Types: Ideation  @webcentral @meeting",
    radioSelection: [[0, 0]],
    checkboxSelection: [[0, 0]],
    total: "FREE",
    billingCycle: "One-time",
    consulting: "Meeting",
    meetingTypes: "Meet and Greet",
  },
  /* MULTIPLE MEETING TYPE SELECTION */
  {
    name: "Billing Term: One-Time, Meeting Types: Ideation & Meet and Greet  @webcentral @meeting",
    radioSelection: [[0, 0]],
    checkboxSelection: [
      [0, 0],
      [0, 1],
    ],
    total: "FREE",
    billingCycle: "One-time",
    consulting: "Meeting",
    meetingTypes: "Meet and Greet, Ideation",
  },
  {
    name: "Billing Term: One-Time, Meeting Types: All  @webcentral @meeting",
    radioSelection: [[0, 0]],
    checkboxSelection: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
    ],
    total: "FREE",
    billingCycle: "One-time",
    consulting: "Meeting",
    meetingTypes:
      "Meet and Greet, Referral or Introduction, Ideation, Enquiry, Interview x 2, Validation",
  },
];
