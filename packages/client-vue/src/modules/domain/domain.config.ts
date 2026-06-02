import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  domain: {
    root: cva("flex w-full flex-col gap-6"),
    choices: cva(""),
    listings: {
      item: cva(
        "shadow-border-transparent [&:hover,&[data-hover=true]]:shadow-border-transparent border-surface bg-surface !rounded-none border-t p-0",
        {
          variants: {
            hasExactMatch: {
              true: "first:border-t-0",
              false: ""
            }
          }
        }
      ),
      root: cva("list-none"),
      interstitial: cva("min-h-80", {
        variants: {
          padding: {
            none: "py-0 lg:py-0",
            md: "pt-12 pb-0 lg:pt-24",
            lg: "pt-24 pb-0 lg:pt-28"
          }
        }
      })
    },

    form: {
      root: cva("flex flex-col gap-y-2", {
        variants: {
          isDisabled: {
            true: "pointer-events-none cursor-default",
            false: ""
          }
        },
        defaultVariants: {
          isDisabled: false
        }
      }),
      trigger: {
        root: cva(
          "outline-control-active cursor-pointer py-3 pr-5 outline-offset-4 hover:no-underline"
        ),
        label: cva("flex cursor-pointer items-center"),
        radio: cva("relative flex w-11 justify-center pl-1.5")
      },
      item: cva(
        "bg-control-surface shadow-control-default hover:shadow-control-hover control-radius border-none transition-all duration-200",
        {
          variants: {
            isDisabled: {
              true: "cursor-not-allowed opacity-50",
              false: ""
            }
          },
          defaultVariants: { isDisabled: false }
        }
      ),
      card: cva("bg-base"),
      loading: cva("text-secondary"),
      content: {
        root: cva("p-4 pt-0 md:pl-11"),
        container: cva(
          "data-[state=open]:animate-accordion-transform-down data-[state=closed]:animate-accordion-transform-up overflow-visible transition-all duration-200"
        )
      },
      basket: {
        item: cva("text-base")
      }
    },

    search: {
      root: cva("gap-4 py-0 pl-6 text-xl font-medium"),
      field: cva("min-h-19"),
      icon: cva(
        "text-muted hidden items-center justify-center pr-4 pl-1 md:flex"
      ),
      actions: cva("flex items-center justify-center gap-4"),
      clear: cva("hidden transition-opacity duration-200 md:block", {
        variants: {
          isEmpty: {
            true: "pointer-events-none opacity-0",
            false: "opacity-100"
          }
        }
      })
    },

    card: {
      root: cva("m-0 flex w-full flex-col space-y-6 md:flex-row md:space-y-0"),
      underline: cva("underline underline-offset-8"),
      header: cva("m-0 flex w-full flex-col gap-2 pr-4"),
      badges: cva("flex items-center gap-2"),
      title: cva("m-0 text-xl font-normal tracking-wide"),
      text: cva(
        "text-emphasis-medium m-0 inline-flex items-center gap-2 text-xs leading-5 font-normal"
      ),

      // ---
      footer: cva(
        "text-emphasis-medium m-0 flex w-full items-center justify-end gap-10 text-right text-xs leading-5 font-normal"
      ),
      actions: cva("w-full min-w-48 empty:hidden md:w-auto"),
      owned: {
        root: cva("m-0 items-end"),
        ownership: cva("font-semibold"),
        icon: cva(
          "bg-accent text-accent-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("not-italic"),
        discount: cva(
          "text-emphasis-medium text-md block font-normal line-through"
        ),
        tld: cva("uppercase not-italic"),
        action: cva("")
      },
      basket: {
        root: cva("m-0 items-end"),
        ownership: cva("font-semibold"),
        tld: cva("uppercase not-italic"),
        icon: cva(
          "bg-accent text-accent-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("not-italic"),
        discount: cva(
          "text-emphasis-medium text-md block font-normal line-through"
        ),
        action: cva("")
      },
      available: {
        root: cva("m-0 items-end"),
        ownership: cva("font-medium"),
        tld: cva("uppercase not-italic"),
        icon: cva(
          "bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("m-0 text-lg font-semibold tracking-wide not-italic"),
        discount: cva(
          "text-emphasis-medium block text-xs font-normal line-through"
        ),
        action: cva("")
      },
      transfer: {
        root: cva("m-0 items-end"),
        ownership: cva("font-normal"),
        tld: cva("uppercase not-italic"),
        icon: cva(
          "bg-secondary text-secondary-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("not-italic"),
        discount: cva("text-xs font-normal line-through"),
        action: cva("")
      }
    },

    empty: {
      root: cva(
        "flex flex-col items-center justify-center gap-4 rounded-lg p-4"
      ),
      title: cva("m-0 text-inherit"),
      text: cva("text-muted m-0 text-center"),
      icon: cva("text-muted size-8")
    },

    drawer: {
      root: cva(""),
      header: cva(""),
      content: cva(""),
      footer: cva("flex-row items-center justify-between gap-x-4")
    },

    transitions: {
      fade: {
        enter: {
          active: cva("duration-300 ease-out"),
          from: cva("transform opacity-0"),
          to: cva("opacity-100")
        },
        leave: {
          active: cva("hidden duration-200 ease-in"),
          from: cva("opacity-100"),
          to: cva("transform opacity-0")
        }
      }
    }
  },
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
            true: "w-44",
            false: "w-14"
          }
        }
      })
    }
  }
};
