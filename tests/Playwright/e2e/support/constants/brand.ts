export const slotTemplates: Record<
  string,
  { context: string; templates: string[] }
> = {
  login_page: {
    context: "auth",
    templates: [
      "split",
      "enclosed",
      "canvas-card",
      "surface-box",
      "two-column-ltr",
      "two-column-rtl"
    ]
  },
  register_page: {
    context: "auth",
    templates: [
      "split",
      "enclosed",
      "canvas-card",
      "surface-box",
      "two-column-ltr",
      "two-column-rtl"
    ]
  },
  footer: {
    context: "auth",
    templates: ["surface-box", "two-column-ltr", "two-column-rtl"]
  },
  basket_summary_footer: {
    context: "basket",
    templates: ["full", "two-column-ltr", "two-column-rtl", "enclosed"]
  }
};
