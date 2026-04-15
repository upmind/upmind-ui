import { cva } from "class-variance-authority";

export default {
  page: cva(
    "bg-canvas relative flex w-full flex-col items-center gap-0 text-base antialiased"
  ),
  content: cva("relative flex min-h-screen w-full flex-col items-center")
};
