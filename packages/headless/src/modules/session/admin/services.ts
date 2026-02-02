// // --- internal
// import {
//   useBasket,
//   useBrand,
//   useI18n,
//   useQuery,
//   useSystem
// } from "../../../../dist";
// import { useRecaptcha, useTracking } from "../../system";
// import {
//   BrandConfigKeys,
//   Contexts,
//   GrantTypes,
//   type IToken,
//   TwofaProviders
// } from "@upmind-automation/types";

// // --- utils
// import { isEmpty, map } from "lodash-es";
// import {
//   DetailedError,
//   ErrorOrigin,
//   responseCodes,
//   useCookies
// } from "../../../utils";
// import { getTokenFromStorage, persistTokenToStorage } from "../utils";

// // ---types
// import type {
//   GuestContext,
//   LoginModel,
//   RecoverModel,
//   RegisterModel
// } from "../types";
// import type { AnyEventObject } from "xstate";
// import { mapCustomField } from "../../client/customFields/mappers";

// // -----------------------------------------------------------------------------

// async function load(_context: GuestContext, _event: AnyEventObject) {
//   const { ensureConfig } = useBrand();
//   const { fetchCountries } = useSystem();

//   await Promise.allSettled([
//     fetchCountries(),
//     ensureConfig([BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION])
//   ]);

//   const token = getTokenFromStorage(Contexts.GUEST);
//   if (!isEmpty(token)) return Promise.resolve(token);

//   const { post, useUrl } = useQuery();

//   return post<IToken>({
//     mutationKey: ["session"],
//     url: useUrl("access_token", {}, { context: "oauth" }),
//     data: { grant_type: GrantTypes.GUEST }
//   }).then(data => {
//     persistTokenToStorage(data);
//     return data;
//   });
// }

// async function loadUser(token?: IToken) {
//   const { get, useUrl } = useQuery();
//   const admin = isAdmin.value;

//   // If no token passed, try to get from storage
//   if (!token) {
//     token = getTokenFromStorage(admin ? "user" : "client") as IToken;
//   }

//   return get({
//     url: useUrl(admin ? "admin/self" : "self", {
//       with: ["actor", "accounts"].join()
//     }),
//     queryKey: admin ? ["session", "admin"] : ["client"],
//     withAccessToken: token?.access_token || true,
//     withoutLocale: admin
//   });
// }

// async function authenticate({ model }: GuestContext<LoginModel>) {
//   const { post, useUrl } = useQuery();
//   const { currency } = useBasket();

//   const data: any = {
//     username: model.username,
//     password: model.password,
//     grant_type: GrantTypes.PASSWORD
//   };

//   // Add.match the basket currency (if available)
//   // to persist the currency when a client logs in and claims a basket
//   // without it, the basket will revert to the default currency
//   if (currency.value) data.currency_id = currency.value.id;

//   const admin = isAdmin.value;
//   if (admin) {
//     data.grant_type = "admin";
//     delete data.currency_id;
//   }

//   return post<IToken>({
//     mutationKey: admin ? ["session", "admin"] : ["session"],
//     url: useUrl(
//       "access_token",
//       {},
//       {
//         context: "oauth"
//       }
//     ),
//     data
//   }).then(data => {
//     // we record the history of the token to be able to reference the originating guest token
//     if (data.actor_type === GrantTypes.TWOFA) return data;

//     persistTokenToStorage(data);
//     return loadUser(data);
//   });
// }

// async function verify2fa({ token }: GuestContext, { data }: AnyEventObject) {
//   const { t } = useI18n();
//   const { post, useUrl } = useQuery();
//   return post<IToken>({
//     mutationKey: ["session"],
//     url: useUrl("access_token", {}, { context: "oauth" }),
//     withAccessToken: token.access_token,
//     data: {
//       grant_type: GrantTypes.TWOFA,
//       twofa_provider: TwofaProviders.GOOGLE,
//       twofa_code: data
//     }
//   })
//     .then(data => {
//       persistTokenToStorage(data);
//       return loadUser(data);
//     })
//     .catch(error => {
//       return Promise.reject(
//         new DetailedError(
//           error.message || t("error.twofa_not_valid"),
//           responseCodes.Unprocessable_Entity,
//           ErrorOrigin.Upmind,
//           {
//             token: error.message || t("error.token_not_available")
//           }
//         )
//       );
//     });
// }

// async function getCustomFields(_context: GuestContext, _event: AnyEventObject) {
//   const { get, useUrl } = useQuery();

//   return get({
//     // url: useUrl("clients_fields", { brand_id: null }),
//     url: useUrl("clients_fields", {
//       "filter[show_on_order_form]": true
//     }),
//     queryKey: ["session", "guest", "custom-fields"],
//     select: data => map(data ?? [], mapCustomField)
//   });
// }

// async function checkForReCaptcha(
//   _context: GuestContext,
//   { data }: AnyEventObject
// ) {
//   // not implemented so pass through
//   return Promise.resolve(data);
// }

// async function verifyReCaptcha(
//   _context: GuestContext,
//   { data }: AnyEventObject
// ) {
//   // not implemented so pass through
//   return Promise.resolve(data);
// }

// async function register(context: GuestContext<RegisterModel>) {
//   const admin = isAdmin.value;

//   if (admin) {
//     return authenticate(context as unknown as GuestContext<LoginModel>);
//   }

//   const { model } = context;
//   const { currency } = useBasket();
//   const { post, useUrl } = useQuery();
//   const recaptcha = useRecaptcha();
//   const { get: getCookie } = useCookies();
//   const { get: getTracking } = useTracking();

//   const data: any = {
//     custom_fields: model?.customFields,
//     email: model?.username,
//     username: model?.username,
//     firstname: model?.firstname,
//     lastname: model?.lastname,
//     password: model?.password,
//     phone: model.phone?.nationalNumber,
//     phone_code: model.phone?.countryCallingCode,
//     phone_country_code: model.phone?.country
//   };

//   // ---
//   // Conditional data

//   // Add.match the basket currency (if available)
//   // to persist the currency when a client registers and claims a basket
//   // without it, the basket will revert to the default currency
//   if (currency.value) data.currency_id = currency.value.id;

//   // add recaptcha token if available
//   await recaptcha
//     .generate("client_register")
//     .then(token => (data.recaptcha_token = token))
//     .catch(() => null); // do nothing

// add referral cookie if available, NB DO NOT DECODE
// const referralCookie = getCookie("upm_aff", v => v);//   if (referralCookie) data.referral_cookie = referralCookie;

//   // add tracking if available
//   await getTracking()
//     .then(values => (data.tracking = values))
//     .catch(() => null);

//   // ---

//   return post<IToken>({
//     mutationKey: ["session"],
//     url: useUrl("clients/register"),
//     data,
//     withAccessToken: true
//   })
//     .then(data => loadUser(data as any))
//     .finally(() => {
//       recaptcha.clear(); // clear our recaptcha token that has been used, even if the registration fails
//     });
// }

// async function recover({ model }: GuestContext<RecoverModel>) {
//   const recaptcha = useRecaptcha();
//   const { post, useUrl } = useQuery();

//   const data: any = {
//     username: model?.username
//   };

//   // add recaptcha token if available
//   await recaptcha
//     .generate("client_register")
//     .then(token => (data.recaptcha_token = token))
//     .catch(() => null); // do nothing

//   return post({
//     mutationKey: ["session"],
//     url: useUrl("clients/password_reset"),
//     data
//   }).finally(() => {
//     recaptcha.clear(); // clear our recaptcha token that has been used, even if the registration fails
//   });
// }

// // -----------------------------------------------------------------------------

// export default {
//   load,
//   // ---
//   verify2fa,
//   authenticate,
//   // ---
//   getCustomFields,
//   checkForReCaptcha,
//   verifyReCaptcha,
//   recover,
//   register
// };
