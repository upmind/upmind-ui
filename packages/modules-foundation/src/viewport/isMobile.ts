import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

// Shared reactive flag, true below Tailwind's `lg` breakpoint. Read as `isMobile.value`.
export const isMobile = useBreakpoints(breakpointsTailwind).smaller("lg");
