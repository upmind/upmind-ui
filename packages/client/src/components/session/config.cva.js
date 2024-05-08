import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  session: {
    root: cva("flex flex-col gap-8"),
    header: cva("flex flex-col gap-2 "),
    footer: cva(
      "text-sm flex flex-col gap-2 font-light leading-tight tracking-tight"
    ),
    content: cva("rounded-box items-start"),
  },

  auth: {
    root: cva("flex flex-col gap-8"),
    form: cva("place-items-start"),
  },

  profile: {
    root: cva("bg-base-100 border rounded"),
    avatar: cva("relative m-0 sm:w-1/2 md:w-36 aspect-square"),
    image: cva(
      "object-cover w-full h-full rounded-t aspect-square w-full h-full"
    ),
    content: cva("card-body py-2 px-4"),
    title: cva("m-0 text-inherit"),
    text: cva("m-0 text-inherit text-sm italic"),
    meta: cva("text-sm font-light italic block"),
    actions: cva("flex justify-end mt-auto"),
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
};
