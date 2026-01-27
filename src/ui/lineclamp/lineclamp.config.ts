import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// display: -webkit-box;
//     -webkit-line-clamp: var(--line-clamp, 2);
//     -webkit-box-orient: vertical;

export default {
  lineclamp: {
    root: cva(""),
    wrapper: cva("[&_p]:mb-0 [&_pre]:whitespace-pre-wrap!", {
      variants: {
        lines: {
          1: "",
          2: "",
          3: "",
          4: "",
          5: "",
          6: "",
          7: "",
          8: ""
        },
        isOpen: {
          true: "line-clamp-none",
          false: "is-clamped"
        }
      },
      compoundVariants: [
        {
          isOpen: false,
          lines: 1,
          class: "line-clamp-1"
        },
        {
          isOpen: false,
          lines: 2,
          class: "line-clamp-2"
        },
        {
          isOpen: false,
          lines: 3,
          class: "line-clamp-3"
        },
        {
          isOpen: false,
          lines: 4,
          class: "line-clamp-4"
        },
        {
          isOpen: false,
          lines: 5,
          class: "line-clamp-5"
        },
        {
          isOpen: false,
          lines: 6,
          class: "line-clamp-6"
        },
        {
          isOpen: false,
          lines: 7,
          class: "line-clamp-[7]"
        },
        {
          isOpen: false,
          lines: 8,
          class: "line-clamp-[8]"
        }
      ]
    }),
    actions: cva("m-0")
  }
};
