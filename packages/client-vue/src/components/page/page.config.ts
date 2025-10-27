import { cva } from "class-variance-authority";

export default {
  page: cva(
    "bg-canvas relative flex min-h-screen w-full flex-col items-center justify-center gap-0 text-base antialiased"
  )
};
