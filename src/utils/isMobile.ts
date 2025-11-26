import { breakpointsTailwind } from "@vueuse/core";
import { useBreakpoints } from "@vueuse/core";
import { computed } from "vue";

const breakpoints = useBreakpoints(breakpointsTailwind);

export const isMobile = breakpoints.smaller("lg");
