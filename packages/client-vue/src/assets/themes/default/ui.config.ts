import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  page: cva("", {
    variants: {
      route: {
        recommendations: "overflow-hidden",
        "product.recommendations": "overflow-hidden"
      }
    }
  })
};
