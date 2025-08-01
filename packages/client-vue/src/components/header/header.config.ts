import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  header: {
    avatar: {
      login: cva("bg-primary-background text-foreground"),
      session: cva("bg-primary-background text-foreground")
    }
  }
};
