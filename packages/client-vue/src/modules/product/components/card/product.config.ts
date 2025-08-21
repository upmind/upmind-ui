import { cva } from "class-variance-authority";

export const rootVariant = cva(
  "text-foreground group relative flex h-full min-h-80 flex-col",
  {
    variants: {
      variant: {
        default: "",
        bordered: "bg-base-background rounded-lg border p-9",
        flush: "bg-base-background"
      }
    }
  }
);

export const contentVariant = cva("flex h-full flex-col", {
  variants: {
    variant: {
      default: "gap-8",
      bordered: "gap-8",
      flush: ""
    }
  }
});

export const detailsVariant = cva("flex flex-1 flex-col gap-8", {
  variants: {
    variant: {
      default: "",
      bordered: "",
      flush: "rounded-b-lg border border-t-0 p-9"
    }
  }
});

export const imageVariant = cva("h-auto w-full", {
  variants: {
    variant: {
      default: "",
      bordered: "",
      flush: "rounded-t-lg rounded-b-none"
    }
  }
});

export const promotionVariant = cva("", {
  variants: {
    preservePromotion: {
      true: "opacity-0 select-none",
      false: ""
    }
  }
});

export default {
  product: {
    root: rootVariant,
    image: imageVariant,
    content: contentVariant,
    details: detailsVariant,
    header: {
      root: cva("flex flex-1 list-none flex-col gap-6"),
      info: {
        root: cva("flex flex-col gap-3"),
        container: cva("flex flex-col gap-2"),
        title: cva("m-0 text-2xl font-medium"),
        terms: cva("text-md m-0"),
        description: cva("text-emphasis-medium m-0 line-clamp-3 text-sm"),
        promotion: promotionVariant
      },
      benefits: {
        root: cva("m-0 flex flex-col border-y py-3"),
        item: cva(
          "text-base-foreground m-0 flex items-start justify-start gap-2 text-sm/loose font-medium"
        ),
        icon: cva("flex h-lh items-center justify-center")
      },
      price: {
        root: cva("flex flex-1 flex-col justify-end gap-0.5"),
        regularPrice: cva(
          "text-emphasis-medium flex items-center gap-2 text-sm"
        ),
        currentPrice: {
          root: cva("flex items-end gap-1"),
          amount: cva("text-3xl font-medium"),
          term: cva("text-sm/loose")
        },
        total: cva("text-emphasis-medium text-sm")
      }
    },
    footer: cva("flex flex-col gap-3")
  }
};
