import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  recommendation: {
    root: cva("relative h-full w-full !p-0"),
    container: cva("flex h-full flex-col"),

    imageContainer: cva("aspect-video shrink-0 overflow-hidden rounded-t-lg"),
    image: cva("m-0 h-full w-full rounded-t-lg object-cover object-center"),
    imagePlaceholder: cva(
      "from-promotion to-promotion-200 h-full w-full bg-gradient-to-br"
    ),

    content: cva("flex flex-1 flex-col justify-between space-y-8 p-6"),
    contentDescription: cva(
      "flex flex-1 flex-col gap-y-6 text-sm font-medium leading-6"
    ),
    title: cva("m-0 text-2xl font-semibold"),
    description: cva("text-emphasis-medium m-0 min-h-12 text-sm leading-6"),

    priceContainer: cva("not-prose flex flex-col gap-y-2"),
    priceIntro: cva("text-emphasis-medium text-sm"),
    priceCurrent: cva("text-3xl font-bold"),
    priceTerm: cva("text-emphasis-medium ml-1 text-sm leading-none"),
    priceSummary: cva("text-emphasis-medium mt-1 text-sm"),

    badge: cva("absolute left-4 -translate-y-1/2 !text-sm ring-1 ring-white"),

    benefitsContainer: cva(
      "text-base-foreground flex items-start gap-2 leading-tight"
    ),
    benefit: cva("flex items-start gap-2 leading-tight"),
    benefitIconContainer: cva("text-secondary flex-shrink-0"),
    benefitIcon: cva("size-5"),
    benefitLabel: cva("m-0"),
  },
};
