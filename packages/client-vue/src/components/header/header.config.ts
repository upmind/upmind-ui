import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  header: {
    avatar: {
      login: cva("bg-primary-background text-primary-foreground"),
      session: cva("bg-primary-background text-primary-foreground")
    }
  }
};
