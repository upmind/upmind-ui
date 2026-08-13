import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module components/auth/AuthJourney.styles
 * @description CVA configuration for AuthJourney.
 */

export default {
  authJourney: {
    root: cva("flex flex-col gap-4"),

    // The reading width the `useAuth` page set for these forms, kept with them
    // so the surface reads the same over a page and inside the modal.
    form: cva("max-w-xl pt-6"),

    alert: cva("max-w-xl"),

    identity: cva("flex items-center gap-2")
  }
};
