import { utils } from "@upmind-automation/headless";

// --- expose our utils from headless
export const useMoney = utils.useMoney;
export const useUrl = utils.useUrl;
export const useTime = utils.useTime;
export const useRelativeTime = utils.useRelativeTime;
export const useCookies = utils.useCookies;
export const useTracking = utils.useTracking;

// --- expose our custom utils
export * from "./useState";
