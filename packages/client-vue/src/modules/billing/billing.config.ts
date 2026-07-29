import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  billing: {
    form: {
      sections: cva("min-h-32")
    },
    loading: {
      // Standalone billing pages (incl. enclosed/full) cap the form width;
      // rendered as an inset section card it must fill the card to match
      // the sibling sections. `card` is the discriminator — `inline` is also
      // true on enclosed/full, which must keep the cap.
      root: cva("", {
        variants: {
          card: {
            false: "max-w-3xl",
            true: ""
          }
        },
        defaultVariants: {
          card: false
        }
      }),
      spinner: cva("z-10! w-full rounded")
    },
    card: {
      // Enclosing Card around the readonly details; empty when the Section is
      // already a card and the details render flat.
      root: cva("", {
        variants: {
          card: {
            true: "",
            false: "space-y-4"
          }
        },
        defaultVariants: { card: false }
      })
    },
    summary: {
      root: cva("space-y-1 text-sm"),
      row: cva("flex items-start gap-2 font-medium"),
      label: cva(
        "data-[danger=true]:text-accent-danger data-[danger=false]:text-muted w-24 font-normal"
      ),
      value: cva("flex items-center gap-2"),
      avatar: cva("size-4"),
      // load-state bars; widths mirror the company/phone/address rows above
      skeleton: {
        action: cva("h-4 w-14"),
        companyLabel: cva("h-4 w-16"),
        companyValue: cva("h-4 w-28"),
        phoneLabel: cva("h-4 w-12"),
        phoneValue: cva("h-4 w-32"),
        addressLabel: cva("h-4 w-16"),
        address: cva("flex flex-col gap-1"),
        addressLine: cva("h-4 w-36"),
        addressCity: cva("h-4 w-24")
      }
    }
  }
};
