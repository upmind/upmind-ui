import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  session: {
    root: cva(""),
    header: cva("flex w-full flex-col gap-2"),
    title: cva(
      "start-between m-0 flex w-full items-center gap-4 text-5xl font-light leading-tight text-inherit"
    ),
    name: cva("font-normal"),
    text: cva("text-base-700 m-0 text-lg font-light leading-7"),
    footer: cva(
      "flex flex-col gap-2 text-sm font-light leading-tight tracking-tight"
    ),
    content: cva("rounded-box w-full max-w-5xl items-start"),

    transition: {
      enter: {
        active: cva("m-0 transition duration-300 ease-out"),
        from: cva("-translate-y-10 transform opacity-0"),
        to: cva("translate-y-0 transform opacity-100")
      },

      leave: {
        active: cva("absolute transition duration-100 ease-in"),
        from: cva("translate-y-0 transform opacity-100"),
        to: cva("-translate-y-1 transform opacity-0")
      }
    },

    auth: {
      root: cva("flex flex-col gap-8"),
      form: cva("place-items-start"),
      actions: cva("my-4 flex items-center justify-center space-x-2")
    },

    profile: {
      trigger: cva("rounded-full p-0"),
      loading: cva(""),
      label: cva("sr-only"),
      avatar: cva("my-0 size-8")
    }
  }
};
