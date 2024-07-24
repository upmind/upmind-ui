import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// display: -webkit-box;
//     -webkit-line-clamp: var(--line-clamp, 2);
//     -webkit-box-orient: vertical;

export default {
  lineclamp: {
    root: cva("upw-lineclamp"),
    wrapper: cva("upw-lineclamp-wrapper", {
      variants: {
        isOpen: {
          true: "line-clamp-none",
        },
      },
    }),
    actions: cva(""),
  },
};
