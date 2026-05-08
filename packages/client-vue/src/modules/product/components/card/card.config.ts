import { cva } from "class-variance-authority";

export const rootVariant = cva("relative flex h-full flex-col text-base", {
  variants: {
    variant: {
      flush: "",
      carded: "bg-base-background rounded-lg border p-9",
      "flush-carded": "bg-base-background"
    }
  }
});

export const contentVariant = cva("flex h-full flex-col", {
  variants: {
    variant: {
      flush: "gap-8",
      carded: "gap-8",
      "flush-carded": ""
    }
  }
});

export const detailsVariant = cva("flex flex-1 flex-col gap-8", {
  variants: {
    variant: {
      flush: "",
      carded: "",
      "flush-carded": "rounded-b-lg border border-t-0 p-9"
    },
    hideTerms: {
      true: "gap-8",
      false: "gap-3"
    }
  }
});

export const imageContainerVariant = cva("relative w-full", {
  variants: {
    variant: {
      flush: "image-radius",
      carded: "image-radius",
      "flush-carded": "image-radius-t"
    },
    isImageEmpty: {
      true: "",
      false: ""
    }
  },
  compoundVariants: [
    {
      variant: "flush-carded",
      isImageEmpty: true,
      class: "border"
    }
  ]
});

export const imageRootVariant = cva("w-full", {
  variants: {
    variant: {
      flush: "",
      carded: "",
      "flush-carded": "image-radius-t [&_img]:rounded-b-none!"
    },
    isLoading: {
      true: "opacity-50"
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
    image: {
      link: cva("block w-full"),
      container: imageContainerVariant,
      root: imageRootVariant,
      badge: cva("absolute top-4 left-4")
    },
    content: contentVariant,
    details: detailsVariant,
    header: {
      root: cva("flex flex-1 list-none flex-col gap-6"),
      info: {
        root: cva("flex flex-col gap-3"),
        container: cva("flex flex-col gap-2"),
        title: cva("m-0 inline-block text-2xl font-medium"),
        terms: cva("text-md m-0"),
        description: cva("text-muted m-0 line-clamp-3 text-sm"),
        promotion: promotionVariant
      },
      benefits: {
        root: cva("border-control-default m-0 flex flex-col border-y py-3"),
        item: cva(
          "text-sm-loose m-0 flex items-start justify-start gap-2 text-base font-medium"
        ),
        icon: cva("flex h-lh items-center justify-center")
      },
      price: {
        root: cva("flex flex-1 flex-col justify-end gap-0.5"),
        regularPrice: cva("text-muted flex items-center gap-2 text-sm"),
        currentPrice: {
          root: cva("flex items-end gap-1"),
          amount: cva("text-3xl font-medium"),
          term: cva("text-sm-loose")
        },
        total: cva("text-muted text-sm")
      }
    },
    footer: cva("flex flex-col gap-3")
  }
};
