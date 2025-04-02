import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  header: {
    avatar: {
      login: cva("bg-secondary-background text-secondary-foreground"),
      session: cva("bg-secondary-background text-secondary-foreground"),
    },
  },
};
