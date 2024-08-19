// --- externals

// --- utils
import { useMoney } from "../../utils";
import {
  compact,
  find,
  first,
  get,
  isObject,
  map,
  orderBy,
  reduce,
  set,
  some,
  uniqBy,
} from "lodash-es";

// --- types
import type { IDomainProduct } from "./types.d";
// ----------------------------------------------------------------------------

export function parseDomain(data: Object | string) {
  if (isObject(data)) data = get(data, "domain");

  const parsed = data
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  const value = {
    domain: parsed,
    tld: parsed?.match(/(?:^[^.]+)(\..{2,})/i)?.[1] || "",
    sld: first(parsed?.split(".")) || "",
  };

  if (value.domain && value.tld && value.sld) return value;

  return undefined;
}

export function parseSld(data: string) {
  if (!data?.length) return;

  const parsed = data
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  const value = first(parsed?.split(".")) || "";
  return value;
}

export function parseAvailable(sld: string, results = [] as IDomainProduct[]) {
  // parse the results
  const available = map(results, item => parseBasketItem({ ...item, sld }));

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

export function parseValue(data: Object | string, values = [], available = []) {
  // parse the domain name provided
  const value = (isObject(data) ? data?.domain : data)?.toLowerCase();

  // check if we already have the domain
  let domain = find(values, ["domain", value]);

  // if we dont then add it to our list of values, if it exists in available
  domain ??= find(available, ["domain", value]);

  // finally parse the domain name provided and check if its a valid domain
  domain ??= parseDomain(value);

  return domain;
}

export function parseBasketItem(item) {
  const { removeTrailingZeroes } = useMoney();
  const tld = item?.tld || item?.name;
  const sld = item?.sld || item?.provision_fields?.sld;
  const domain = [sld, tld].join("").toLowerCase();
  const result = {
    product_id: item.product_id,
    quantity: item.quantity,
    options: !item?.domain_available ? parseOptions(item?.options) : {},
    is_available: item?.domain_available,
    // ---
    tld,
    sld,
    domain,
  };
  const term =
    item.term || first(orderBy(item.prices, "billing_cycle_months", "asc"));
  if (term) {
    result.billing_cycle_months =
      item?.billing_cycle_months ||
      item?.term?.billing_cycle_months ||
      item?.term;
    result.billing_cycle_years = Math.round(term?.billing_cycle_months / 12);
    result.is_discounted = !!term?.price_discounted_formatted;
    result.price_formatted = removeTrailingZeroes(term?.price_formatted);
    result.price_discounted_formatted = removeTrailingZeroes(
      term?.price_discounted_formatted
    );
    result.percentage_saving = !result?.is_discounted
      ? 0
      : Math.floor(
          ((term?.price - (term?.price_discounted || 0)) / term?.price) * 100
        );

    //   result.billing_summary = $tc(
    //   //   result.is_discounted ? "billing_summary_discounted" : "billing_summary",
    //   //   result.billing_cycle_years,
    //   //   {
    //   //     oldPrice: result.price_formatted,
    //   //     newPrice: result.price_discounted_formatted
    //   //   }
    //   // ),
  }

  return result;
}

// ---

export const parseOptions = (data: any) => {
  const options = reduce(
    data,
    (result, option) => {
      set(result, [option.category_id, option.id], {
        product_id: option.id,
        unit_quantity: option.unit_quantity || 1,
        billing_cycle_months: option.billing_cycle_months,
        order_type: option.order_type,
      });
      return result;
    },
    {}
  );
  return options;
};
