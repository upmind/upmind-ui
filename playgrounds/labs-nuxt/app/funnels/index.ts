import labs from "./labs";

export * from "./types";

// -----------------------------------------------------------------------------
export const registerFunnels = () => {
  return { funnels: { labs }, defaultFunnel: "labs" };
};
