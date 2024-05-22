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
    content: cva("rounded-box items-start my-8 max-w-3xl"),
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
    trigger: cva("p-0 rounded-full"),
    loading: cva(""),
    label: cva("sr-only"),
    avatar: cva("size-8 my-0"),
  },
};
