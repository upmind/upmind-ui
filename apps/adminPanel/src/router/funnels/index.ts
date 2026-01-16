// --- internal
import portal from "./portal";

// -----------------------------------------------------------------------------
export const registerFunnels = () => {
  return {
    funnels: { portal },
    defaultFunnel: "portal"
  };
};
