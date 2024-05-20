import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  session: {
    root: cva(""),
    header: cva("flex flex-col gap-2 "),
    title: cva("m-0 text-inherit w-full text-5xl font-light"),
    name: cva("font-normal"),
    text: cva("m-0 text-lg font-light text-base-700 leading-7"),
    footer: cva(
      "text-sm flex flex-col gap-2 font-light leading-tight tracking-tight"
    ),
    content: cva("rounded-box items-start my-8"),
  },

  sessionTransitionEnter: {
    active: cva("m-0 transition duration-300 ease-out"),
    from: cva("-translate-y-10 transform opacity-0"),
    to: cva("translate-y-0 transform opacity-100"),
  },

  sessionTransitionLeave: {
    active: cva("transition duration-100 ease-in absolute"),
    from: cva("translate-y-0 transform opacity-100"),
    to: cva("-translate-y-1 transform opacity-0"),
  },

  auth: {
    root: cva("flex flex-col gap-8"),
    form: cva("place-items-start"),
  },

  profile: {
    root: cva("relative inline-flex"),
    items: cva(
      "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 w-full min-w-60 space-y-0.5 overflow-hidden overflow-y-auto rounded-lg border p-1 shadow-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
    ),
  },

  profileButton: {
    root: cva(
      "hover:bg-base-50 relative inline-flex w-full cursor-pointer items-center gap-x-4 text-nowrap rounded-full bg-transparent",
      {
        variants: {
          disabled: {
            true: "pointer-events-none opacity-50",
          },
        },
      }
    ),
    active: cva("ring-primary-500 border-primary-500"),
    label: cva("flex-1 leading-none sr-only"),
    avatar: cva(
      "bg-base-200 size-[2em] flex-shrink-0 overflow-hidden rounded-full"
    ),
    image: cva("h-full w-full object-cover"),
    toggle: cva("size-[0.75em] transition-all aria-checked:rotate-180"),
  },

  profileItem: {
    root: cva(
      "text-base-800 flex w-full cursor-pointer items-center justify-start gap-x-4 text-nowrap rounded-lg px-4 py-2 text-left text-sm no-underline focus:outline-none",
      {
        variants: {
          disabled: {
            true: "pointer-events-none opacity-50",
          },
        },
      }
    ),
    active: cva("bg-base-100 hover:bg-base-100"),
    selected: cva("bg-base-100 hover:bg-base-100 cursor-default select-none"),
    label: cva("flex-1 truncate"),
    icon: cva("size-[1.25em]  flex-shrink-0"),
  },

  profileTransitionEnter: {
    active: cva("m-0 transition duration-100 ease-out"),
    from: cva("scale-95 transform opacity-0"),
    to: cva("scale-100 transform opacity-100"),
  },
  profileTransitionLeave: {
    active: cva("transition duration-75 ease-in"),
    from: cva("scale-100 transform opacity-100"),
    to: cva("scale-95 transform opacity-0"),
  },
};
