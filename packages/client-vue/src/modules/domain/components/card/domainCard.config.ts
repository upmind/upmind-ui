import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  card: {
    root: cva(
      "group flex flex-col justify-between py-6 text-base font-normal md:flex-row md:gap-4",
      {
        variants: {
          isExactMatch: {
            true: "card-radius border-surface mb-12 border px-5 md:px-8 md:py-9",
            false: "md:px-6 md:py-4"
          }
        }
      }
    ),
    header: {
      root: cva("flex gap-5"),
      details: {
        root: cva(""),
        status: {
          root: cva("flex items-center justify-between gap-2"),
          label: cva("text-muted text-sm-tight")
        },
        title: {
          root: cva(
            "flex flex-col items-start md:flex-row md:items-center md:gap-3"
          ),
          fld: cva("break-all", {
            variants: {
              isExactMatch: {
                true: "text-3xl md:text-4xl",
                false:
                  "text-2xl transition-transform duration-300 ease-out group-hover:translate-x-2"
              }
            }
          }),
          sld: cva(""),
          tld: cva("font-semibold")
        },
        badge: cva("my-2 md:py-0"),
        pricing: cva("text-faint text-sm-tight")
      }
    },
    footer: {
      root: cva("flex flex-col gap-2 md:flex-row md:items-center md:gap-4"),
      price: {
        root: cva("flex items-center gap-1 whitespace-nowrap"),
        amount: cva("text-xl font-semibold"),
        term: cva("text-muted text-sm")
      },
      button: {
        root: cva("w-full md:mt-0 md:w-auto"),
        label: cva("", {
          variants: {
            isExactMatch: {
              true: "",
              false: "md:hidden"
            }
          }
        })
      }
    },
    skeleton: {
      heights: cva("w-56 w-64 w-72"),
      root: cva("", {
        variants: {
          isExactMatch: {
            true: "md:py-8",
            false: "md:py-4"
          }
        }
      }),
      title: cva("", {
        variants: {
          isExactMatch: {
            true: "h-10",
            false: "h-7"
          }
        }
      }),
      button: cva("", {
        variants: {
          isExactMatch: {
            true: "w-full lg:w-44",
            false: "w-full lg:w-14"
          }
        }
      }),
      // Priced rows in priceLoading state — shown while /suggestions/tlds
      // is in flight after /suggestions has already returned domain rows.
      description: cva("h-4 w-32"),
      price: cva("h-6 w-24"),
      priceButton: cva("button-radius h-11")
    }
  }
};
