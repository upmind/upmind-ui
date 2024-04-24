// --- externals
import { unref } from "vue";

// --- utils
import { useMoney } from "../../utils";
import { map, orderBy, uniqBy, first, compact, reduce, set } from "lodash-es";

// --- types
import type { IDomainProduct } from "./types.d";
// ----------------------------------------------------------------------------

export function parseDomain(domain: string) {
  domain = unref(domain);

  if (!domain) {
    return;
  }

  const value = domain
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  return {
    domain: value,
    tld: value?.match(/(?:^[^.]+)(\..{2,})/i)?.[1] || "",
    sld: first(value?.split(".")) || "",
  };
}

export function parseAvailable(
  sld: string,
  results = [] as IDomainProduct[],
  available = [] as IDomainProduct[]
): IDomainProduct[] {
  // map the available to a new array
  const newAvailable = map(results, item => parseDomainItem({ ...item, sld }));

  // then add the new available to any existing available
  available.push(...newAvailable);

  // and ensure we don't have any duplicates or falsy
  available = compact(uniqBy(available, "domain"));

  return available;
}

export function parseDomainItem(item) {
  const { removeTrailingZeroes } = useMoney();
  const result = {
    product_id: item.product_id,
    options: !item?.domain_available
      ? useAddedOptionsParser(item?.options)
      : {},
    tld: item?.tld,
    sld: item?.sld,
    domain: [item.sld, item.tld].join("").toLowerCase(),
    is_available: item?.domain_available,
  };

  if (item?.prices?.length) {
    const term = first(orderBy(item.prices, "billing_cycle_months", "asc"));

    result.billing_cycle_months = term.billing_cycle_months;
    result.billing_cycle_years = Math.round(term.billing_cycle_months / 12);
    result.is_discounted = !!term.price_discounted_formatted;
    result.price_formatted = removeTrailingZeroes(term.price_formatted);
    result.price_discounted_formatted = removeTrailingZeroes(
      term.price_discounted_formatted
    );

    result.percentage_saving = !result.is_discounted
      ? 0
      : Math.floor(
          ((term.price - (term.price_discounted || 0)) / term.price) * 100
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

const useAddedOptionsParser = (data: any) => {
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
