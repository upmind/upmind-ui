import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  session: {
    root: cva(""),
    header: cva("flex w-full flex-col gap-2"),
    title: cva(
      "start-between m-0 flex w-full items-center gap-4 text-5xl leading-tight font-light text-inherit"
    ),
    name: cva("font-normal"),
    text: cva("text-base-700 m-0 text-lg leading-7 font-light"),
    footer: cva(
      "flex flex-col gap-2 text-sm leading-tight font-light tracking-tight"
    ),
    content: cva("rounded-box w-full max-w-5xl items-start"),
    markdown: cva("my-6"),

    transition: {
      enter: {
        active: cva("m-0 transition duration-200 ease-out"),
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
      container: cva("max-w-3xl"),
      root: cva("flex max-w-3xl flex-col gap-8"),
      form: cva("place-items-start"),
      actions: cva("mt-3 flex items-center justify-start space-x-2")
    },

    profile: {
      trigger: cva("rounded-full p-0"),
      loading: cva(""),
      label: cva("sr-only"),
      avatar: cva("my-0 size-8")
    },

    expired: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-col flex-wrap items-center items-start justify-center justify-start gap-6 py-16"
      ),
      title: cva("m-0 text-center text-3xl font-light text-inherit"),
      text: cva(
        "text-base-500 m-0 text-center text-sm leading-5 tracking-tight"
      ),
      avatar: cva("bg-primary text-primary-foreground size-20 p-2")
    }
  }
};
