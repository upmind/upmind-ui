import { cva } from "class-variance-authority";

export default {
  page: cva(
    "bg-canvas relative flex min-h-screen w-full flex-col items-center gap-0 text-base antialiased"
  ),
  content: cva(
    "relative flex min-h-screen w-full flex-col items-center has-[.layout-fit]:min-h-0 has-[.layout-fit]:grow"
  )
};
