// --- external

// --- internal
import { useI18n, useLocale } from "../../..";
import sharedServices from "../services";
import { beginSetup } from "../services";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useScripts,
  useValidation
} from "../../../../utils";
import { get, some } from "lodash-es";
import { parseSettings } from "../utils";

// --- types
import {
  CURRENCY_TO_COUNTRY,
  DLOCAL_FIELDS,
  type DLocalContext
} from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

const DLOCAL_SCRIPT_PRODUCTION = "https://js.dlocal.com/";
const DLOCAL_SCRIPT_SANDBOX = "https://js-sandbox.dlocal.com/";

// -----------------------------------------------------------------------------

async function load(context: DLocalContext, _event: AnyEventObject) {
  const { gateway, address } = context;
  const { t } = useI18n();
  const { locale } = useLocale();
  if (!gateway)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  return sharedServices.load(context, _event).then(async config => {
    const settings = parseSettings(gateway);
    const smartFieldsKey = get(settings, DLOCAL_FIELDS.SMART_FIELDS_KEY);
    const testMode = get(settings, DLOCAL_FIELDS.TEST_MODE);
    const country =
      address?.country?.code ||
      CURRENCY_TO_COUNTRY[context.currency?.code?.toUpperCase() ?? ""];

    if (!smartFieldsKey || !country)
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless,
        { smartFieldsKey, country }
      );

    const scriptUrl = testMode
      ? DLOCAL_SCRIPT_SANDBOX
      : DLOCAL_SCRIPT_PRODUCTION;
    await useScripts().load("dlocal_v1", scriptUrl, {});

    const dlocalGlobal = window["dlocal"];

    if (!dlocalGlobal)
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    const dlocal = dlocalGlobal(smartFieldsKey);

    const fields = dlocal.fields({
      locale: (locale.value ?? "en").slice(0, 2),
      country
    });

    // Resolve CSS tokens at runtime so the iframe content matches the theme
    const css = getComputedStyle(document.documentElement);
    const rootFontSize = parseFloat(css.fontSize) || 16;
    const token = (name: string) => css.getPropertyValue(name).trim();

    // NB: dLocal's iframe cannot resolve rem units — convert to px.
    const toPx = (value: string) => {
      const match = value.match(/^([\d.]+)rem$/);
      return match ? `${parseFloat(match[1]) * rootFontSize}px` : value;
    };

    const style = {
      base: {
        fontSize: toPx(token("--text-md")),
        fontFamily: token("--font-body"),
        lineHeight: toPx(token("--text-md--line-height")),
        fontSmoothing: "antialiased",
        fontWeight: token("--font-display-weight"),
        color: token("--color-core-base"),
        "::placeholder": { color: token("--color-core-faint") },
        ":focus": { color: token("--color-core-base") },
        ":hover": { color: token("--color-core-base") },
        iconColor: token("--color-core-faint")
      },
      invalid: {
        color: token("--color-danger-default"),
        ":focus": { color: token("--color-danger-default") }
      }
    };

    const formFields = {
      card: fields.create("card", { style })
      // pan: fields.create("pan", { style }),
      // expiry: fields.create("expiration", { style }),
      // cvv: fields.create("cvv", { style })
    };
    return { sdk: { dlocal, fields: formFields }, ...config };
  });
}

// NB: Rendering is handled by the GatewayDLocalRenderer Vue component, which
//     receives the sdk fields via uischema options and mounts them into its own
//     template ref. The machine still transitions through rendering→available
//     (preserving the hasRendered guard), but no DOM work happens here.
async function render({ sdk }: DLocalContext, _event: AnyEventObject) {
  return Promise.resolve({ sdk });
}

async function validate(
  { schema, model, sdk, error }: DLocalContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();

  const { validate } = useValidation();

  if (!schema) return model;

  const errors = validate(schema, model) || [];
  // SDK validation errors are persisted to error context via setErrorSDK action
  if (
    errors?.length ||
    some(error?.data, ["instancePath", "/payment_method_addition"])
  ) {
    throw new DetailedError(
      t("error.payment_gateway_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      [...errors, ...(error?.data ?? [])]
    );
  }

  return model;
}

/**
 * @name pay
 * @desc Creates a dLocal token via the Smart Fields SDK and returns the model
 * with payment_method_addition populated. Payer fields (document, phone) are
 * forwarded alongside the token for the backend to process.
 */
async function pay({ sdk, model, gateway, currency }: DLocalContext) {
  const { t } = useI18n();

  if (!sdk?.dlocal || !sdk?.fields)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  // createToken expects the pan/card field element
  const tokenField = sdk.fields.pan ?? sdk.fields.card;

  return sdk.dlocal
    .createToken(tokenField, {
      name: model!.holder_name,
      document: model?.payment_method_addition.document,
      phone: model?.payment_method_addition.phone?.number ?? undefined
    })
    .then(result => {
      return {
        ...model,
        payment_method_addition: {
          token: result.token ?? undefined,
          phone: model?.payment_method_addition.phone?.number ?? undefined,
          document: model?.payment_method_addition.document ?? undefined,
          currency: currency.code
        }
      };
    })
    .catch(({ error }) => {
      const errorMessage = (error as { message?: string })?.message;
      throw new DetailedError(
        errorMessage ?? t("error.payment_gateway_update_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.External,
        error
      );
    });
}

/**
 * @name add
 * @desc Stores a payment method via dLocal in the ADD context.
 * Calls beginSetup → SDK createToken → endSetup.
 */
async function add(context: DLocalContext) {
  const { sdk, model } = context;
  const { t } = useI18n();

  if (!sdk?.dlocal || !sdk?.fields)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  const setupResponse = await beginSetup(context);
  const clientPaymentDetailsId = get(
    setupResponse,
    "client_payment_details.id"
  );

  if (!clientPaymentDetailsId) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  const tokenField = sdk.fields.pan ?? sdk.fields.card;

  return sdk.dlocal
    .createToken(tokenField, {
      name: model!.holder_name,
      document: model?.payment_method_addition?.document,
      phone: model?.payment_method_addition?.phone?.number ?? undefined
    })
    .then(result => {
      return {
        gatewayId: context.gateway?.id,
        data: {
          client_payment_details_id: clientPaymentDetailsId,
          auto_payment: model?.store_on_payment_auto_payment ?? false,
          token: result.token
        }
      };
    })
    .catch(({ error }) => {
      const errorMessage = (error as { message?: string })?.message;
      throw new DetailedError(
        errorMessage ?? t("error.payment_gateway_update_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.External,
        error
      );
    });
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  // ---
  load,
  render,
  validate,
  pay,
  add
};
