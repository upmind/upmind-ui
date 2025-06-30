// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: cva("rounded-full"),
  page: cva("w-full bg-background text-foreground transition-colors", {
    variants: {
      loading: {
        false: "",
        true: "bg-white"
      },
      route: {
        "client.addresses": "",
        "client.addresses.add": "",
        "client.addresses.edit": "",
        "client.emails": "",
        "client.emails.add": "",
        "client.emails.edit": ""
      }
    },

    defaultVariants: {
      loading: false
    },

    compoundVariants: [
      {
        route: [
          "client.addresses",
          "client.addresses.add",
          "client.addresses.edit"
        ],
        loading: false,
        class: "bg-background"
      },
      {
        route: ["client.emails", "client.emails.add", "client.emails.edit"],
        loading: false,
        class: "bg-background"
      }
    ]
  })
};
