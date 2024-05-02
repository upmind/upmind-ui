// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwListbox } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwListbox> = {
  parameters: {
    controls: {
      exclude: ["size"],
    },
  },
  component: UpwListbox,
  argTypes: {
    placement: useSystemArgTypes.placement,
    // size: useSystemArgTypes.size,
    avatar: useSystemArgTypes.flag,
    icon: useSystemArgTypes.icon,
    iconSelected: useSystemArgTypes.icon,
    toggle: useSystemArgTypes.icon,
  },
  args: {
    label: "Select an Item..",
    // size: "md",
    avatar: undefined,
    icon: undefined,
    iconSelected: "check",
    // ---
    multiple: false,
    hasSearch: false,
    counter: undefined,
    toggle: undefined,
    toggleRotate: true,
    placement: "bottom-start",
    items: {
      item1: { value: "item1", label: "Item 1" },
      item2: { value: "item2", label: "Item 2" },
      item3: { value: "item3", label: "Item 3" },
      item4: { value: "item4", label: "Item 4" },
      item5: { value: "item5", label: "Item 5" },
      item6: { value: "item6", label: "Item 6" },
      item7: { value: "item7", label: "Item 7" },
      item8: { value: "item8", label: "Item 8" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpwListbox>;

const countries = {
  AF: {
    avatar: {
      path: "flags",
      name: "af",
    },
    label: "Afghanistan",
    value: "AF",
  },
  AX: {
    avatar: {
      path: "flags",
      name: "ax",
    },
    label: "Aland Islands",
    value: "AX",
  },
  AL: {
    avatar: {
      path: "flags",
      name: "al",
    },
    label: "Albania",
    value: "AL",
  },
  DZ: {
    avatar: {
      path: "flags",
      name: "dz",
    },
    label: "Algeria",
    value: "DZ",
  },
  AS: {
    avatar: {
      path: "flags",
      name: "as",
    },
    label: "American Samoa",
    value: "AS",
  },
  AD: {
    avatar: {
      path: "flags",
      name: "ad",
    },
    label: "Andorra",
    value: "AD",
  },
  AO: {
    avatar: {
      path: "flags",
      name: "ao",
    },
    label: "Angola",
    value: "AO",
  },
  AI: {
    avatar: {
      path: "flags",
      name: "ai",
    },
    label: "Anguilla",
    value: "AI",
  },
  AG: {
    avatar: {
      path: "flags",
      name: "ag",
    },
    label: "Antigua and Barbuda",
    value: "AG",
  },
  AR: {
    avatar: {
      path: "flags",
      name: "ar",
    },
    label: "Argentina",
    value: "AR",
  },
  AM: {
    avatar: {
      path: "flags",
      name: "am",
    },
    label: "Armenia",
    value: "AM",
  },
  AW: {
    avatar: {
      path: "flags",
      name: "aw",
    },
    label: "Aruba",
    value: "AW",
  },
  AU: {
    avatar: {
      path: "flags",
      name: "au",
    },
    label: "Australia",
    value: "AU",
  },
  AT: {
    avatar: {
      path: "flags",
      name: "at",
    },
    label: "Austria",
    value: "AT",
  },
  AZ: {
    avatar: {
      path: "flags",
      name: "az",
    },
    label: "Azerbaijan",
    value: "AZ",
  },
  BS: {
    avatar: {
      path: "flags",
      name: "bs",
    },
    label: "Bahamas",
    value: "BS",
  },
  BH: {
    avatar: {
      path: "flags",
      name: "bh",
    },
    label: "Bahrain",
    value: "BH",
  },
  BD: {
    avatar: {
      path: "flags",
      name: "bd",
    },
    label: "Bangladesh",
    value: "BD",
  },
  BB: {
    avatar: {
      path: "flags",
      name: "bb",
    },
    label: "Barbados",
    value: "BB",
  },
  BY: {
    avatar: {
      path: "flags",
      name: "by",
    },
    label: "Belarus",
    value: "BY",
  },
  BE: {
    avatar: {
      path: "flags",
      name: "be",
    },
    label: "Belgium",
    value: "BE",
  },
  BZ: {
    avatar: {
      path: "flags",
      name: "bz",
    },
    label: "Belize",
    value: "BZ",
  },
  BJ: {
    avatar: {
      path: "flags",
      name: "bj",
    },
    label: "Benin",
    value: "BJ",
  },
  BM: {
    avatar: {
      path: "flags",
      name: "bm",
    },
    label: "Bermuda",
    value: "BM",
  },
  BT: {
    avatar: {
      path: "flags",
      name: "bt",
    },
    label: "Bhutan",
    value: "BT",
  },
  BO: {
    avatar: {
      path: "flags",
      name: "bo",
    },
    label: "Bolivia (Plurinational State of)",
    value: "BO",
  },
  BQ: {
    avatar: {
      path: "flags",
      name: "bq",
    },
    label: "Bonaire, Sint Eustatius and Saba",
    value: "BQ",
  },
  BA: {
    avatar: {
      path: "flags",
      name: "ba",
    },
    label: "Bosnia and Herzegovina",
    value: "BA",
  },
  BW: {
    avatar: {
      path: "flags",
      name: "bw",
    },
    label: "Botswana",
    value: "BW",
  },
  BR: {
    avatar: {
      path: "flags",
      name: "br",
    },
    label: "Brazil",
    value: "BR",
  },
  IO: {
    avatar: {
      path: "flags",
      name: "io",
    },
    label: "British Indian Ocean Territory",
    value: "IO",
  },
  BN: {
    avatar: {
      path: "flags",
      name: "bn",
    },
    label: "Brunei Darussalam",
    value: "BN",
  },
  BG: {
    avatar: {
      path: "flags",
      name: "bg",
    },
    label: "Bulgaria",
    value: "BG",
  },
  BF: {
    avatar: {
      path: "flags",
      name: "bf",
    },
    label: "Burkina Faso",
    value: "BF",
  },
  BI: {
    avatar: {
      path: "flags",
      name: "bi",
    },
    label: "Burundi",
    value: "BI",
  },
  CV: {
    avatar: {
      path: "flags",
      name: "cv",
    },
    label: "Cabo Verde",
    value: "CV",
  },
  KH: {
    avatar: {
      path: "flags",
      name: "kh",
    },
    label: "Cambodia",
    value: "KH",
  },
  CM: {
    avatar: {
      path: "flags",
      name: "cm",
    },
    label: "Cameroon",
    value: "CM",
  },
  CA: {
    avatar: {
      path: "flags",
      name: "ca",
    },
    label: "Canada",
    value: "CA",
  },
  KY: {
    avatar: {
      path: "flags",
      name: "ky",
    },
    label: "Cayman Islands",
    value: "KY",
  },
  CF: {
    avatar: {
      path: "flags",
      name: "cf",
    },
    label: "Central African Republic",
    value: "CF",
  },
  TD: {
    avatar: {
      path: "flags",
      name: "td",
    },
    label: "Chad",
    value: "TD",
  },
  CL: {
    avatar: {
      path: "flags",
      name: "cl",
    },
    label: "Chile",
    value: "CL",
  },
  CN: {
    avatar: {
      path: "flags",
      name: "cn",
    },
    label: "China",
    value: "CN",
  },
  CX: {
    avatar: {
      path: "flags",
      name: "cx",
    },
    label: "Christmas Island",
    value: "CX",
  },
  CC: {
    avatar: {
      path: "flags",
      name: "cc",
    },
    label: "Cocos (Keeling) Islands",
    value: "CC",
  },
  CO: {
    avatar: {
      path: "flags",
      name: "co",
    },
    label: "Colombia",
    value: "CO",
  },
  KM: {
    avatar: {
      path: "flags",
      name: "km",
    },
    label: "Comoros",
    value: "KM",
  },
  CK: {
    avatar: {
      path: "flags",
      name: "ck",
    },
    label: "Cook Islands",
    value: "CK",
  },
  CR: {
    avatar: {
      path: "flags",
      name: "cr",
    },
    label: "Costa Rica",
    value: "CR",
  },
  HR: {
    avatar: {
      path: "flags",
      name: "hr",
    },
    label: "Croatia",
    value: "HR",
  },
  CU: {
    avatar: {
      path: "flags",
      name: "cu",
    },
    label: "Cuba",
    value: "CU",
  },
  CW: {
    avatar: {
      path: "flags",
      name: "cw",
    },
    label: "Curaçao",
    value: "CW",
  },
  CY: {
    avatar: {
      path: "flags",
      name: "cy",
    },
    label: "Cyprus",
    value: "CY",
  },
  CZ: {
    avatar: {
      path: "flags",
      name: "cz",
    },
    label: "Czech Republic",
    value: "CZ",
  },
  CI: {
    avatar: {
      path: "flags",
      name: "ci",
    },
    label: "Côte Ivoire",
    value: "CI",
  },
  CD: {
    avatar: {
      path: "flags",
      name: "cd",
    },
    label: "Democratic Republic of the Congo",
    value: "CD",
  },
  DK: {
    avatar: {
      path: "flags",
      name: "dk",
    },
    label: "Denmark",
    value: "DK",
  },
  DJ: {
    avatar: {
      path: "flags",
      name: "dj",
    },
    label: "Djibouti",
    value: "DJ",
  },
  DM: {
    avatar: {
      path: "flags",
      name: "dm",
    },
    label: "Dominica",
    value: "DM",
  },
  DO: {
    avatar: {
      path: "flags",
      name: "do",
    },
    label: "Dominican Republic",
    value: "DO",
  },
  EC: {
    avatar: {
      path: "flags",
      name: "ec",
    },
    label: "Ecuador",
    value: "EC",
  },
  EG: {
    avatar: {
      path: "flags",
      name: "eg",
    },
    label: "Egypt",
    value: "EG",
  },
  SV: {
    avatar: {
      path: "flags",
      name: "sv",
    },
    label: "El Salvador",
    value: "SV",
  },
  "GB:ENG": {
    avatar: {
      path: "flags",
      name: "gb",
    },
    label: "England",
    value: "GB",
  },
  GQ: {
    avatar: {
      path: "flags",
      name: "gq",
    },
    label: "Equatorial Guinea",
    value: "GQ",
  },
  ER: {
    avatar: {
      path: "flags",
      name: "er",
    },
    label: "Eritrea",
    value: "ER",
  },
  EE: {
    avatar: {
      path: "flags",
      name: "ee",
    },
    label: "Estonia",
    value: "EE",
  },
  ET: {
    avatar: {
      path: "flags",
      name: "et",
    },
    label: "Ethiopia",
    value: "ET",
  },
  FK: {
    avatar: {
      path: "flags",
      name: "fk",
    },
    label: "Falkland Islands",
    value: "FK",
  },
  FO: {
    avatar: {
      path: "flags",
      name: "fo",
    },
    label: "Faroe Islands",
    value: "FO",
  },
  FM: {
    avatar: {
      path: "flags",
      name: "fm",
    },
    label: "Federated States of Micronesia",
    value: "FM",
  },
  FJ: {
    avatar: {
      path: "flags",
      name: "fj",
    },
    label: "Fiji",
    value: "FJ",
  },
  FI: {
    avatar: {
      path: "flags",
      name: "fi",
    },
    label: "Finland",
    value: "FI",
  },
  FR: {
    avatar: {
      path: "flags",
      name: "fr",
    },
    label: "France",
    value: "FR",
  },
  GF: {
    avatar: {
      path: "flags",
      name: "gf",
    },
    label: "French Guiana",
    value: "GF",
  },
  PF: {
    avatar: {
      path: "flags",
      name: "pf",
    },
    label: "French Polynesia",
    value: "PF",
  },
  TF: {
    avatar: {
      path: "flags",
      name: "tf",
    },
    label: "French Southern Territories",
    value: "TF",
  },
  GA: {
    avatar: {
      path: "flags",
      name: "ga",
    },
    label: "Gabon",
    value: "GA",
  },
  GM: {
    avatar: {
      path: "flags",
      name: "gm",
    },
    label: "Gambia",
    value: "GM",
  },
  GE: {
    avatar: {
      path: "flags",
      name: "ge",
    },
    label: "Georgia",
    value: "GE",
  },
  DE: {
    avatar: {
      path: "flags",
      name: "de",
    },
    label: "Germany",
    value: "DE",
  },
  GH: {
    avatar: {
      path: "flags",
      name: "gh",
    },
    label: "Ghana",
    value: "GH",
  },
  GI: {
    avatar: {
      path: "flags",
      name: "gi",
    },
    label: "Gibraltar",
    value: "GI",
  },
  GR: {
    avatar: {
      path: "flags",
      name: "gr",
    },
    label: "Greece",
    value: "GR",
  },
  GL: {
    avatar: {
      path: "flags",
      name: "gl",
    },
    label: "Greenland",
    value: "GL",
  },
  GD: {
    avatar: {
      path: "flags",
      name: "gd",
    },
    label: "Grenada",
    value: "GD",
  },
  GP: {
    avatar: {
      path: "flags",
      name: "gp",
    },
    label: "Guadeloupe",
    value: "GP",
  },
  GU: {
    avatar: {
      path: "flags",
      name: "gu",
    },
    label: "Guam",
    value: "GU",
  },
  GT: {
    avatar: {
      path: "flags",
      name: "gt",
    },
    label: "Guatemala",
    value: "GT",
  },
  GG: {
    avatar: {
      path: "flags",
      name: "gg",
    },
    label: "Guernsey",
    value: "GG",
  },
  GN: {
    avatar: {
      path: "flags",
      name: "gn",
    },
    label: "Guinea",
    value: "GN",
  },
  GW: {
    avatar: {
      path: "flags",
      name: "gw",
    },
    label: "Guinea-Bissau",
    value: "GW",
  },
  GY: {
    avatar: {
      path: "flags",
      name: "gy",
    },
    label: "Guyana",
    value: "GY",
  },
  HT: {
    avatar: {
      path: "flags",
      name: "ht",
    },
    label: "Haiti",
    value: "HT",
  },
  VA: {
    avatar: {
      path: "flags",
      name: "va",
    },
    label: "Holy See",
    value: "VA",
  },
  HN: {
    avatar: {
      path: "flags",
      name: "hn",
    },
    label: "Honduras",
    value: "HN",
  },
  HK: {
    avatar: {
      path: "flags",
      name: "hk",
    },
    label: "Hong Kong",
    value: "HK",
  },
  HU: {
    avatar: {
      path: "flags",
      name: "hu",
    },
    label: "Hungary",
    value: "HU",
  },
  IS: {
    avatar: {
      path: "flags",
      name: "is",
    },
    label: "Iceland",
    value: "IS",
  },
  IN: {
    avatar: {
      path: "flags",
      name: "in",
    },
    label: "India",
    value: "IN",
  },
  ID: {
    avatar: {
      path: "flags",
      name: "id",
    },
    label: "Indonesia",
    value: "ID",
  },
  IR: {
    avatar: {
      path: "flags",
      name: "ir",
    },
    label: "Iran (Islamic Republic of)",
    value: "IR",
  },
  IQ: {
    avatar: {
      path: "flags",
      name: "iq",
    },
    label: "Iraq",
    value: "IQ",
  },
  IE: {
    avatar: {
      path: "flags",
      name: "ie",
    },
    label: "Ireland",
    value: "IE",
  },
  IM: {
    avatar: {
      path: "flags",
      name: "im",
    },
    label: "Isle of Man",
    value: "IM",
  },
  IL: {
    avatar: {
      path: "flags",
      name: "il",
    },
    label: "Israel",
    value: "IL",
  },
  IT: {
    avatar: {
      path: "flags",
      name: "it",
    },
    label: "Italy",
    value: "IT",
  },
  JM: {
    avatar: {
      path: "flags",
      name: "jm",
    },
    label: "Jamaica",
    value: "JM",
  },
  JP: {
    avatar: {
      path: "flags",
      name: "jp",
    },
    label: "Japan",
    value: "JP",
  },
  JE: {
    avatar: {
      path: "flags",
      name: "je",
    },
    label: "Jersey",
    value: "JE",
  },
  JO: {
    avatar: {
      path: "flags",
      name: "jo",
    },
    label: "Jordan",
    value: "JO",
  },
  KZ: {
    avatar: {
      path: "flags",
      name: "kz",
    },
    label: "Kazakhstan",
    value: "KZ",
  },
  KE: {
    avatar: {
      path: "flags",
      name: "ke",
    },
    label: "Kenya",
    value: "KE",
  },
  KI: {
    avatar: {
      path: "flags",
      name: "ki",
    },
    label: "Kiribati",
    value: "KI",
  },
  KW: {
    avatar: {
      path: "flags",
      name: "kw",
    },
    label: "Kuwait",
    value: "KW",
  },
  KG: {
    avatar: {
      path: "flags",
      name: "kg",
    },
    label: "Kyrgyzstan",
    value: "KG",
  },
  LA: {
    avatar: {
      path: "flags",
      name: "la",
    },
    label: "Laos",
    value: "LA",
  },
  LV: {
    avatar: {
      path: "flags",
      name: "lv",
    },
    label: "Latvia",
    value: "LV",
  },
  LB: {
    avatar: {
      path: "flags",
      name: "lb",
    },
    label: "Lebanon",
    value: "LB",
  },
  LS: {
    avatar: {
      path: "flags",
      name: "ls",
    },
    label: "Lesotho",
    value: "LS",
  },
  LR: {
    avatar: {
      path: "flags",
      name: "lr",
    },
    label: "Liberia",
    value: "LR",
  },
  LY: {
    avatar: {
      path: "flags",
      name: "ly",
    },
    label: "Libya",
    value: "LY",
  },
  LI: {
    avatar: {
      path: "flags",
      name: "li",
    },
    label: "Liechtenstein",
    value: "LI",
  },
  LT: {
    avatar: {
      path: "flags",
      name: "lt",
    },
    label: "Lithuania",
    value: "LT",
  },
  LU: {
    avatar: {
      path: "flags",
      name: "lu",
    },
    label: "Luxembourg",
    value: "LU",
  },
  MO: {
    avatar: {
      path: "flags",
      name: "mo",
    },
    label: "Macau",
    value: "MO",
  },
  MG: {
    avatar: {
      path: "flags",
      name: "mg",
    },
    label: "Madagascar",
    value: "MG",
  },
  MW: {
    avatar: {
      path: "flags",
      name: "mw",
    },
    label: "Malawi",
    value: "MW",
  },
  MY: {
    avatar: {
      path: "flags",
      name: "my",
    },
    label: "Malaysia",
    value: "MY",
  },
  MV: {
    avatar: {
      path: "flags",
      name: "mv",
    },
    label: "Maldives",
    value: "MV",
  },
  ML: {
    avatar: {
      path: "flags",
      name: "ml",
    },
    label: "Mali",
    value: "ML",
  },
  MT: {
    avatar: {
      path: "flags",
      name: "mt",
    },
    label: "Malta",
    value: "MT",
  },
  MH: {
    avatar: {
      path: "flags",
      name: "mh",
    },
    label: "Marshall Islands",
    value: "MH",
  },
  MQ: {
    avatar: {
      path: "flags",
      name: "mq",
    },
    label: "Martinique",
    value: "MQ",
  },
  MR: {
    avatar: {
      path: "flags",
      name: "mr",
    },
    label: "Mauritania",
    value: "MR",
  },
  MU: {
    avatar: {
      path: "flags",
      name: "mu",
    },
    label: "Mauritius",
    value: "MU",
  },
  YT: {
    avatar: {
      path: "flags",
      name: "yt",
    },
    label: "Mayotte",
    value: "YT",
  },
  MX: {
    avatar: {
      path: "flags",
      name: "mx",
    },
    label: "Mexico",
    value: "MX",
  },
  MD: {
    avatar: {
      path: "flags",
      name: "md",
    },
    label: "Moldova",
    value: "MD",
  },
  MC: {
    avatar: {
      path: "flags",
      name: "mc",
    },
    label: "Monaco",
    value: "MC",
  },
  MN: {
    avatar: {
      path: "flags",
      name: "mn",
    },
    label: "Mongolia",
    value: "MN",
  },
  ME: {
    avatar: {
      path: "flags",
      name: "me",
    },
    label: "Montenegro",
    value: "ME",
  },
  MS: {
    avatar: {
      path: "flags",
      name: "ms",
    },
    label: "Montserrat",
    value: "MS",
  },
  MA: {
    avatar: {
      path: "flags",
      name: "ma",
    },
    label: "Morocco",
    value: "MA",
  },
  MZ: {
    avatar: {
      path: "flags",
      name: "mz",
    },
    label: "Mozambique",
    value: "MZ",
  },
  MM: {
    avatar: {
      path: "flags",
      name: "mm",
    },
    label: "Myanmar",
    value: "MM",
  },
  NA: {
    avatar: {
      path: "flags",
      name: "na",
    },
    label: "Namibia",
    value: "NA",
  },
  NR: {
    avatar: {
      path: "flags",
      name: "nr",
    },
    label: "Nauru",
    value: "NR",
  },
  NP: {
    avatar: {
      path: "flags",
      name: "np",
    },
    label: "Nepal",
    value: "NP",
  },
  NL: {
    avatar: {
      path: "flags",
      name: "nl",
    },
    label: "Netherlands",
    value: "NL",
  },
  NC: {
    avatar: {
      path: "flags",
      name: "nc",
    },
    label: "New Caledonia",
    value: "NC",
  },
  NZ: {
    avatar: {
      path: "flags",
      name: "nz",
    },
    label: "New Zealand",
    value: "NZ",
  },
  NI: {
    avatar: {
      path: "flags",
      name: "ni",
    },
    label: "Nicaragua",
    value: "NI",
  },
  NE: {
    avatar: {
      path: "flags",
      name: "ne",
    },
    label: "Niger",
    value: "NE",
  },
  NG: {
    avatar: {
      path: "flags",
      name: "ng",
    },
    label: "Nigeria",
    value: "NG",
  },
  NU: {
    avatar: {
      path: "flags",
      name: "nu",
    },
    label: "Niue",
    value: "NU",
  },
  NF: {
    avatar: {
      path: "flags",
      name: "nf",
    },
    label: "Norfolk Island",
    value: "NF",
  },
  KP: {
    avatar: {
      path: "flags",
      name: "kp",
    },
    label: "North Korea",
    value: "KP",
  },
  MK: {
    avatar: {
      path: "flags",
      name: "mk",
    },
    label: "North Macedonia",
    value: "MK",
  },
  "GB:NIR": {
    avatar: {
      path: "flags",
      name: "gb",
    },
    label: "Northern Ireland",
    value: "GB",
  },
  MP: {
    avatar: {
      path: "flags",
      name: "mp",
    },
    label: "Northern Mariana Islands",
    value: "MP",
  },
  NO: {
    avatar: {
      path: "flags",
      name: "no",
    },
    label: "Norway",
    value: "NO",
  },
  OM: {
    avatar: {
      path: "flags",
      name: "om",
    },
    label: "Oman",
    value: "OM",
  },
  PK: {
    avatar: {
      path: "flags",
      name: "pk",
    },
    label: "Pakistan",
    value: "PK",
  },
  PW: {
    avatar: {
      path: "flags",
      name: "pw",
    },
    label: "Palau",
    value: "PW",
  },
  PA: {
    avatar: {
      path: "flags",
      name: "pa",
    },
    label: "Panama",
    value: "PA",
  },
  PG: {
    avatar: {
      path: "flags",
      name: "pg",
    },
    label: "Papua New Guinea",
    value: "PG",
  },
  PY: {
    avatar: {
      path: "flags",
      name: "py",
    },
    label: "Paraguay",
    value: "PY",
  },
  PE: {
    avatar: {
      path: "flags",
      name: "pe",
    },
    label: "Peru",
    value: "PE",
  },
  PH: {
    avatar: {
      path: "flags",
      name: "ph",
    },
    label: "Philippines",
    value: "PH",
  },
  PN: {
    avatar: {
      path: "flags",
      name: "pn",
    },
    label: "Pitcairn",
    value: "PN",
  },
  PL: {
    avatar: {
      path: "flags",
      name: "pl",
    },
    label: "Poland",
    value: "PL",
  },
  PT: {
    avatar: {
      path: "flags",
      name: "pt",
    },
    label: "Portugal",
    value: "PT",
  },
  PR: {
    avatar: {
      path: "flags",
      name: "pr",
    },
    label: "Puerto Rico",
    value: "PR",
  },
  QA: {
    avatar: {
      path: "flags",
      name: "qa",
    },
    label: "Qatar",
    value: "QA",
  },
  CG: {
    avatar: {
      path: "flags",
      name: "cg",
    },
    label: "Republic of the Congo",
    value: "CG",
  },
  RO: {
    avatar: {
      path: "flags",
      name: "ro",
    },
    label: "Romania",
    value: "RO",
  },
  RU: {
    avatar: {
      path: "flags",
      name: "ru",
    },
    label: "Russia",
    value: "RU",
  },
  RW: {
    avatar: {
      path: "flags",
      name: "rw",
    },
    label: "Rwanda",
    value: "RW",
  },
  RE: {
    avatar: {
      path: "flags",
      name: "re",
    },
    label: "Réunion",
    value: "RE",
  },
  BL: {
    avatar: {
      path: "flags",
      name: "bl",
    },
    label: "Saint Barthélemy",
    value: "BL",
  },
  SH: {
    avatar: {
      path: "flags",
      name: "sh",
    },
    label: "Saint Helena, Ascension and Tristan da Cunha",
    value: "SH",
  },
  KN: {
    avatar: {
      path: "flags",
      name: "kn",
    },
    label: "Saint Kitts and Nevis",
    value: "KN",
  },
  LC: {
    avatar: {
      path: "flags",
      name: "lc",
    },
    label: "Saint Lucia",
    value: "LC",
  },
  MF: {
    avatar: {
      path: "flags",
      name: "mf",
    },
    label: "Saint Martin",
    value: "MF",
  },
  PM: {
    avatar: {
      path: "flags",
      name: "pm",
    },
    label: "Saint Pierre and Miquelon",
    value: "PM",
  },
  VC: {
    avatar: {
      path: "flags",
      name: "vc",
    },
    label: "Saint Vincent and the Grenadines",
    value: "VC",
  },
  WS: {
    avatar: {
      path: "flags",
      name: "ws",
    },
    label: "Samoa",
    value: "WS",
  },
  SM: {
    avatar: {
      path: "flags",
      name: "sm",
    },
    label: "San Marino",
    value: "SM",
  },
  ST: {
    avatar: {
      path: "flags",
      name: "st",
    },
    label: "Sao Tome and Principe",
    value: "ST",
  },
  SA: {
    avatar: {
      path: "flags",
      name: "sa",
    },
    label: "Saudi Arabia",
    value: "SA",
  },
  "GB:SCT": {
    avatar: {
      path: "flags",
      name: "gb",
    },
    label: "Scotland",
    value: "GB",
  },
  SN: {
    avatar: {
      path: "flags",
      name: "sn",
    },
    label: "Senegal",
    value: "SN",
  },
  RS: {
    avatar: {
      path: "flags",
      name: "rs",
    },
    label: "Serbia",
    value: "RS",
  },
  SC: {
    avatar: {
      path: "flags",
      name: "sc",
    },
    label: "Seychelles",
    value: "SC",
  },
  SL: {
    avatar: {
      path: "flags",
      name: "sl",
    },
    label: "Sierra Leone",
    value: "SL",
  },
  SG: {
    avatar: {
      path: "flags",
      name: "sg",
    },
    label: "Singapore",
    value: "SG",
  },
  SX: {
    avatar: {
      path: "flags",
      name: "sx",
    },
    label: "Sint Maarten",
    value: "SX",
  },
  SK: {
    avatar: {
      path: "flags",
      name: "sk",
    },
    label: "Slovakia",
    value: "SK",
  },
  SI: {
    avatar: {
      path: "flags",
      name: "si",
    },
    label: "Slovenia",
    value: "SI",
  },
  SB: {
    avatar: {
      path: "flags",
      name: "sb",
    },
    label: "Solomon Islands",
    value: "SB",
  },
  SO: {
    avatar: {
      path: "flags",
      name: "so",
    },
    label: "Somalia",
    value: "SO",
  },
  ZA: {
    avatar: {
      path: "flags",
      name: "za",
    },
    label: "South Africa",
    value: "ZA",
  },
  GS: {
    avatar: {
      path: "flags",
      name: "gs",
    },
    label: "South Georgia and the South Sandwich Islands",
    value: "GS",
  },
  KR: {
    avatar: {
      path: "flags",
      name: "kr",
    },
    label: "South Korea",
    value: "KR",
  },
  SS: {
    avatar: {
      path: "flags",
      name: "ss",
    },
    label: "South Sudan",
    value: "SS",
  },
  ES: {
    avatar: {
      path: "flags",
      name: "es",
    },
    label: "Spain",
    value: "ES",
  },
  LK: {
    avatar: {
      path: "flags",
      name: "lk",
    },
    label: "Sri Lanka",
    value: "LK",
  },
  PS: {
    avatar: {
      path: "flags",
      name: "ps",
    },
    label: "State of Palestine",
    value: "PS",
  },
  SD: {
    avatar: {
      path: "flags",
      name: "sd",
    },
    label: "Sudan",
    value: "SD",
  },
  SR: {
    avatar: {
      path: "flags",
      name: "sr",
    },
    label: "Suriname",
    value: "SR",
  },
  SJ: {
    avatar: {
      path: "flags",
      name: "sj",
    },
    label: "Svalbard and Jan Mayen",
    value: "SJ",
  },
  SZ: {
    avatar: {
      path: "flags",
      name: "sz",
    },
    label: "Swaziland",
    value: "SZ",
  },
  SE: {
    avatar: {
      path: "flags",
      name: "se",
    },
    label: "Sweden",
    value: "SE",
  },
  CH: {
    avatar: {
      path: "flags",
      name: "ch",
    },
    label: "Switzerland",
    value: "CH",
  },
  SY: {
    avatar: {
      path: "flags",
      name: "sy",
    },
    label: "Syrian Arab Republic",
    value: "SY",
  },
  TW: {
    avatar: {
      path: "flags",
      name: "tw",
    },
    label: "Taiwan",
    value: "TW",
  },
  TJ: {
    avatar: {
      path: "flags",
      name: "tj",
    },
    label: "Tajikistan",
    value: "TJ",
  },
  TZ: {
    avatar: {
      path: "flags",
      name: "tz",
    },
    label: "Tanzania",
    value: "TZ",
  },
  TH: {
    avatar: {
      path: "flags",
      name: "th",
    },
    label: "Thailand",
    value: "TH",
  },
  TL: {
    avatar: {
      path: "flags",
      name: "tl",
    },
    label: "Timor-Leste",
    value: "TL",
  },
  TG: {
    avatar: {
      path: "flags",
      name: "tg",
    },
    label: "Togo",
    value: "TG",
  },
  TK: {
    avatar: {
      path: "flags",
      name: "tk",
    },
    label: "Tokelau",
    value: "TK",
  },
  TO: {
    avatar: {
      path: "flags",
      name: "to",
    },
    label: "Tonga",
    value: "TO",
  },
  TT: {
    avatar: {
      path: "flags",
      name: "tt",
    },
    label: "Trinidad and Tobago",
    value: "TT",
  },
  TN: {
    avatar: {
      path: "flags",
      name: "tn",
    },
    label: "Tunisia",
    value: "TN",
  },
  TR: {
    avatar: {
      path: "flags",
      name: "tr",
    },
    label: "Turkey",
    value: "TR",
  },
  TM: {
    avatar: {
      path: "flags",
      name: "tm",
    },
    label: "Turkmenistan",
    value: "TM",
  },
  TC: {
    avatar: {
      path: "flags",
      name: "tc",
    },
    label: "Turks and Caicos Islands",
    value: "TC",
  },
  TV: {
    avatar: {
      path: "flags",
      name: "tv",
    },
    label: "Tuvalu",
    value: "TV",
  },
  UG: {
    avatar: {
      path: "flags",
      name: "ug",
    },
    label: "Uganda",
    value: "UG",
  },
  UA: {
    avatar: {
      path: "flags",
      name: "ua",
    },
    label: "Ukraine",
    value: "UA",
  },
  AE: {
    avatar: {
      path: "flags",
      name: "ae",
    },
    label: "United Arab Emirates",
    value: "AE",
  },
  GB: {
    avatar: {
      path: "flags",
      name: "gb",
    },
    label: "United Kingdom",
    value: "GB",
  },
  UM: {
    avatar: {
      path: "flags",
      name: "um",
    },
    label: "United States Minor Outlying Islands",
    value: "UM",
  },
  US: {
    avatar: {
      path: "flags",
      name: "us",
    },
    label: "United States of America",
    value: "US",
  },
  UY: {
    avatar: {
      path: "flags",
      name: "uy",
    },
    label: "Uruguay",
    value: "UY",
  },
  UZ: {
    avatar: {
      path: "flags",
      name: "uz",
    },
    label: "Uzbekistan",
    value: "UZ",
  },
  VU: {
    avatar: {
      path: "flags",
      name: "vu",
    },
    label: "Vanuatu",
    value: "VU",
  },
  VE: {
    avatar: {
      path: "flags",
      name: "ve",
    },
    label: "Venezuela (Bolivarian Republic of)",
    value: "VE",
  },
  VN: {
    avatar: {
      path: "flags",
      name: "vn",
    },
    label: "Vietnam",
    value: "VN",
  },
  VG: {
    avatar: {
      path: "flags",
      name: "vg",
    },
    label: "Virgin Islands (British)",
    value: "VG",
  },
  VI: {
    avatar: {
      path: "flags",
      name: "vi",
    },
    label: "Virgin Islands (U.S.)",
    value: "VI",
  },
  "GB:WLS": {
    avatar: {
      path: "flags",
      name: "gb",
    },
    label: "Wales",
    value: "GB",
  },
  WF: {
    avatar: {
      path: "flags",
      name: "wf",
    },
    label: "Wallis and Futuna",
    value: "WF",
  },
  EH: {
    avatar: {
      path: "flags",
      name: "eh",
    },
    label: "Western Sahara",
    value: "EH",
  },
  YE: {
    avatar: {
      path: "flags",
      name: "ye",
    },
    label: "Yemen",
    value: "YE",
  },
  ZM: {
    avatar: {
      path: "flags",
      name: "zm",
    },
    label: "Zambia",
    value: "ZM",
  },
  ZW: {
    avatar: {
      path: "flags",
      name: "zw",
    },
    label: "Zimbabwe",
    value: "ZW",
  },
};

// -----------------------------------------------------------------------------

export const Base: Story = {};

export const Countries: Story = {
  parameters: {
    controls: { exclude: ["label", "items", "size"] },
  },
  args: {
    label: "Select a Country",
    items: countries,
    hasSearch: true,
  },
};
