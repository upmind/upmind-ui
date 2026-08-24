import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Domain variants (ADR-024 D-3 — replaces the retired useStyles/domain.config.ts
// shape). One named export per cva, nested keys flattened. Classes copied
// verbatim from domain.config.ts.

// --- domain
export const domainRootVariants = cva("flex w-full flex-col gap-6");
export const domainChoicesVariants = cva("");

// --- domain.listings
export const domainListingsItemVariants = cva(
  "border-stroke bg-surface !rounded-none border-t p-0 [&:has([data-exact-match=true])]:border-t-0"
);
export const domainListingsRootVariants = cva("list-none");
export const domainListingsInterstitialVariants = cva("", {
  variants: {
    padding: {
      none: "min-h-80 py-0 lg:py-0",
      md: "min-h-80 pt-12 pb-0 lg:pt-24",
      // Drawer: bottom-only padding lifts the my-auto-centred loader just above
      // the midline. The md: overrides beat InterstitialBody's own md:py-18.
      lg: "pt-0 pb-20 md:pt-0 md:pb-20"
    }
  }
});

// --- domain.form
export const domainFormRootVariants = cva("flex flex-col gap-y-2", {
  variants: {
    isDisabled: {
      true: "pointer-events-none cursor-default",
      false: ""
    }
  },
  defaultVariants: {
    isDisabled: false
  }
});
export const domainFormTriggerRootVariants = cva(
  "cursor-pointer py-3 pr-5 outline-offset-4 outline-(--control) hover:no-underline"
);
export const domainFormTriggerLabelVariants = cva(
  "flex cursor-pointer items-center"
);
export const domainFormTriggerRadioVariants = cva(
  "relative flex w-11 justify-center pl-1.5"
);
export const domainFormItemVariants = cva(
  "bg-surface shadow-control hover:shadow-control rounded-control border-none transition-all duration-200",
  {
    variants: {
      isDisabled: {
        true: "cursor-not-allowed opacity-50",
        false: ""
      }
    },
    defaultVariants: { isDisabled: false }
  }
);
export const domainFormCardVariants = cva("bg-surface");
export const domainFormLoadingVariants = cva("text-secondary");
export const domainFormContentRootVariants = cva("p-4 pt-0 md:pl-11");
export const domainFormContentContainerVariants = cva(
  "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-visible transition-all duration-200"
);
export const domainFormBasketItemVariants = cva("text-base");

// --- domain.search
export const domainSearchRootVariants = cva(
  "gap-4 py-0 pl-6 text-xl font-medium"
);
export const domainSearchFieldVariants = cva("min-h-19");
export const domainSearchIconVariants = cva(
  "text-muted hidden items-center justify-center pr-4 pl-1 md:flex"
);
export const domainSearchActionsVariants = cva(
  "flex items-center justify-center gap-4"
);
export const domainSearchClearVariants = cva(
  "hidden transition-opacity duration-200 md:block",
  {
    variants: {
      isEmpty: {
        true: "pointer-events-none opacity-0",
        false: "opacity-100"
      }
    }
  }
);

// --- domain.card
export const domainCardRootVariants = cva(
  "m-0 flex w-full flex-col space-y-6 md:flex-row md:space-y-0"
);
export const domainCardUnderlineVariants = cva("underline underline-offset-8");
export const domainCardHeaderVariants = cva(
  "m-0 flex w-full flex-col gap-2 pr-4"
);
export const domainCardBadgesVariants = cva("flex items-center gap-2");
export const domainCardTitleVariants = cva(
  "m-0 text-xl font-normal tracking-wide"
);
export const domainCardTextVariants = cva(
  "text-muted m-0 inline-flex items-center gap-2 text-xs leading-5 font-normal"
);
export const domainCardFooterVariants = cva(
  "text-muted m-0 flex w-full items-center justify-end gap-10 text-right text-xs leading-5 font-normal"
);
export const domainCardActionsVariants = cva(
  "w-full min-w-48 empty:hidden md:w-auto"
);

// --- domain.card.owned
export const domainCardOwnedRootVariants = cva("m-0 items-end");
export const domainCardOwnedOwnershipVariants = cva("font-semibold");
export const domainCardOwnedIconVariants = cva(
  "bg-neutral text-neutral-contrast inline-flex size-5 items-center justify-center rounded-full p-0.5"
);
export const domainCardOwnedPricesVariants = cva("inline-block");
export const domainCardOwnedPriceVariants = cva("not-italic");
export const domainCardOwnedDiscountVariants = cva(
  "text-muted block text-base font-normal line-through"
);
export const domainCardOwnedTldVariants = cva("uppercase not-italic");
export const domainCardOwnedActionVariants = cva("");

// --- domain.card.basket
export const domainCardBasketRootVariants = cva("m-0 items-end");
export const domainCardBasketOwnershipVariants = cva("font-semibold");
export const domainCardBasketTldVariants = cva("uppercase not-italic");
export const domainCardBasketIconVariants = cva(
  "bg-neutral text-neutral-contrast inline-flex size-5 items-center justify-center rounded-full p-0.5"
);
export const domainCardBasketPricesVariants = cva("inline-block");
export const domainCardBasketPriceVariants = cva("not-italic");
export const domainCardBasketDiscountVariants = cva(
  "text-muted block text-base font-normal line-through"
);
export const domainCardBasketActionVariants = cva("");

// --- domain.card.available
export const domainCardAvailableRootVariants = cva("m-0 items-end");
export const domainCardAvailableOwnershipVariants = cva("font-medium");
export const domainCardAvailableTldVariants = cva("uppercase not-italic");
export const domainCardAvailableIconVariants = cva(
  "bg-primary text-primary-contrast inline-flex size-5 items-center justify-center rounded-full p-0.5"
);
export const domainCardAvailablePricesVariants = cva("inline-block");
export const domainCardAvailablePriceVariants = cva(
  "m-0 text-lg font-semibold tracking-wide not-italic"
);
export const domainCardAvailableDiscountVariants = cva(
  "text-muted block text-xs font-normal line-through"
);
export const domainCardAvailableActionVariants = cva("");

// --- domain.card.transfer
export const domainCardTransferRootVariants = cva("m-0 items-end");
export const domainCardTransferOwnershipVariants = cva("font-normal");
export const domainCardTransferTldVariants = cva("uppercase not-italic");
export const domainCardTransferIconVariants = cva(
  "bg-secondary text-secondary-contrast inline-flex size-5 items-center justify-center rounded-full p-0.5"
);
export const domainCardTransferPricesVariants = cva("inline-block");
export const domainCardTransferPriceVariants = cva("not-italic");
export const domainCardTransferDiscountVariants = cva(
  "text-xs font-normal line-through"
);
export const domainCardTransferActionVariants = cva("");

// --- domain.empty
export const domainEmptyRootVariants = cva(
  "flex flex-col items-center justify-center gap-4 rounded-lg p-4"
);
export const domainEmptyTitleVariants = cva("m-0 text-inherit");
export const domainEmptyTextVariants = cva("text-muted m-0 text-center");
export const domainEmptyIconVariants = cva("text-muted size-8");

// --- domain.drawer
export const domainDrawerRootVariants = cva("");
export const domainDrawerHeaderVariants = cva("");
export const domainDrawerContentVariants = cva("");
export const domainDrawerFooterVariants = cva(
  "flex-row items-center justify-between gap-x-4"
);

// --- domain.transitions.fade
export const domainTransitionsFadeEnterActiveVariants = cva(
  "duration-300 ease-out"
);
export const domainTransitionsFadeEnterFromVariants = cva(
  "transform opacity-0"
);
export const domainTransitionsFadeEnterToVariants = cva("opacity-100");
export const domainTransitionsFadeLeaveActiveVariants = cva(
  "hidden duration-200 ease-in"
);
export const domainTransitionsFadeLeaveFromVariants = cva("opacity-100");
export const domainTransitionsFadeLeaveToVariants = cva("transform opacity-0");

// -----------------------------------------------------------------------------
// card.* (DAC result card — used by DomainCard.vue / DomainCardSkeleton.vue)

export const cardRootVariants = cva(
  "group flex flex-col justify-between py-6 text-base font-normal md:flex-row md:gap-4",
  {
    variants: {
      isExactMatch: {
        true: "rounded-card border-stroke mb-12 border px-5 md:px-8 md:py-9",
        // No horizontal inset — the layout (Column / drawer wrapper) owns the
        // gutter, so row dividers stay flush with the card content.
        false: "md:py-4"
      }
    }
  }
);

// --- card.header
export const cardHeaderRootVariants = cva("flex gap-5");
export const cardHeaderDetailsRootVariants = cva("");
export const cardHeaderDetailsStatusRootVariants = cva(
  "flex items-center justify-between gap-2"
);
export const cardHeaderDetailsStatusLabelVariants = cva("text-muted text-sm");
export const cardHeaderDetailsTitleRootVariants = cva(
  "flex flex-col items-start md:flex-row md:items-center md:gap-3"
);
export const cardHeaderDetailsTitleFldVariants = cva("break-all", {
  variants: {
    isExactMatch: {
      true: "text-3xl md:text-4xl",
      false:
        "text-2xl transition-transform duration-300 ease-out group-hover:translate-x-2"
    }
  }
});
export const cardHeaderDetailsTitleSldVariants = cva("");
export const cardHeaderDetailsTitleTldVariants = cva("font-semibold");
export const cardHeaderDetailsBadgeVariants = cva("my-2 md:py-0");
export const cardHeaderDetailsPricingVariants = cva("text-faint text-sm");

// --- card.footer
export const cardFooterRootVariants = cva(
  "flex flex-col gap-2 md:flex-row md:items-center md:gap-4"
);
export const cardFooterPriceRootVariants = cva(
  "flex items-center gap-1 whitespace-nowrap"
);
export const cardFooterPriceAmountVariants = cva("text-xl font-semibold");
export const cardFooterPriceTermVariants = cva("text-muted text-sm");
export const cardFooterButtonRootVariants = cva("w-full md:mt-0 md:w-auto");
export const cardFooterButtonLabelVariants = cva("", {
  variants: {
    isExactMatch: {
      true: "",
      false: "md:hidden"
    }
  }
});

// --- card.skeleton
export const cardSkeletonHeightsVariants = cva("w-56 w-64 w-72");
export const cardSkeletonRootVariants = cva("", {
  variants: {
    isExactMatch: {
      true: "md:py-8",
      false: "md:py-4"
    }
  }
});
export const cardSkeletonTitleVariants = cva("", {
  variants: {
    isExactMatch: {
      true: "h-10",
      false: "h-7"
    }
  }
});
export const cardSkeletonButtonVariants = cva("", {
  variants: {
    isExactMatch: {
      true: "w-44",
      false: "w-14"
    }
  }
});
export const cardSkeletonDescriptionVariants = cva("h-5 w-32");
export const cardSkeletonStatusVariants = cva("h-5 w-20");
export const cardSkeletonPriceVariants = cva("h-6 w-24");
export const cardSkeletonPriceButtonVariants = cva("rounded-button h-11");
