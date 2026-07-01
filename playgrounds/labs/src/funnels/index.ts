import labs from "./labs";

// ---types
export * from "./types";

// -----------------------------------------------------------------------------
export const registerFunnels = () => {
  return { funnels: { labs }, defaultFunnel: "labs" };
};
