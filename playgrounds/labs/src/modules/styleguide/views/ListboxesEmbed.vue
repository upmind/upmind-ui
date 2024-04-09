<template>
  <div
    class="prose mx-auto flex max-w-none flex-wrap place-content-start items-start justify-start gap-4 p-8"
  >
    <upw-listbox
      class="max-w-sm"
      :items="items"
      label="Choose an option"
      icon-selected=""
    />
    <upw-listbox
      class="max-w-sm"
      :items="items"
      multiple
      label="Choose multiple"
    />
    <upw-listbox
      class="max-w-sm"
      :items="items"
      multiple
      counter="chosen"
      label="Choose multiple (counter)"
    />

    <upw-listbox
      class="max-w-sm"
      :items="countries"
      counter="chosen"
      label="Choose Country"
      has-search
    />

    <upw-listbox
      class="max-w-sm"
      :items="countries"
      counter="chosen"
      label="Disabled"
      has-search
      disabled
    />

    <upw-listbox
      class="max-w-sm"
      :items="items"
      label=""
      toggle="navigation-menu-vertical"
    />
  </div>
</template>

<script setup>
import { UpwListbox } from "@upmind/upwind";

const items = {
  typography: { label: "Typography", value: "typography" },
  colors: { label: "Colors", value: "colors" },
  buttons: { label: "Buttons", value: "buttons" },
  account: { label: "Account settings", value: "account" },
  support: { label: "Support", value: "support" },
  license: { label: "License", value: "license" },
  signout: { label: "Sign out", value: "signout" },
  alert: { icon: "cog", label: "Alert" },
};

const countries = {
  AF: {
    icon: {
      path: "flags",
      name: "af",
    },
    label: "Afghanistan",
    value: "AF",
  },
  AX: {
    icon: {
      path: "flags",
      name: "ax",
    },
    label: "Aland Islands",
    value: "AX",
  },
  AL: {
    icon: {
      path: "flags",
      name: "al",
    },
    label: "Albania",
    value: "AL",
  },
  DZ: {
    icon: {
      path: "flags",
      name: "dz",
    },
    label: "Algeria",
    value: "DZ",
  },
  AS: {
    icon: {
      path: "flags",
      name: "as",
    },
    label: "American Samoa",
    value: "AS",
  },
  AD: {
    icon: {
      path: "flags",
      name: "ad",
    },
    label: "Andorra",
    value: "AD",
  },
  AO: {
    icon: {
      path: "flags",
      name: "ao",
    },
    label: "Angola",
    value: "AO",
  },
  AI: {
    icon: {
      path: "flags",
      name: "ai",
    },
    label: "Anguilla",
    value: "AI",
  },
  AG: {
    icon: {
      path: "flags",
      name: "ag",
    },
    label: "Antigua and Barbuda",
    value: "AG",
  },
  AR: {
    icon: {
      path: "flags",
      name: "ar",
    },
    label: "Argentina",
    value: "AR",
  },
  AM: {
    icon: {
      path: "flags",
      name: "am",
    },
    label: "Armenia",
    value: "AM",
  },
  AW: {
    icon: {
      path: "flags",
      name: "aw",
    },
    label: "Aruba",
    value: "AW",
  },
  AU: {
    icon: {
      path: "flags",
      name: "au",
    },
    label: "Australia",
    value: "AU",
  },
  AT: {
    icon: {
      path: "flags",
      name: "at",
    },
    label: "Austria",
    value: "AT",
  },
  AZ: {
    icon: {
      path: "flags",
      name: "az",
    },
    label: "Azerbaijan",
    value: "AZ",
  },
  BS: {
    icon: {
      path: "flags",
      name: "bs",
    },
    label: "Bahamas",
    value: "BS",
  },
  BH: {
    icon: {
      path: "flags",
      name: "bh",
    },
    label: "Bahrain",
    value: "BH",
  },
  BD: {
    icon: {
      path: "flags",
      name: "bd",
    },
    label: "Bangladesh",
    value: "BD",
  },
  BB: {
    icon: {
      path: "flags",
      name: "bb",
    },
    label: "Barbados",
    value: "BB",
  },
  BY: {
    icon: {
      path: "flags",
      name: "by",
    },
    label: "Belarus",
    value: "BY",
  },
  BE: {
    icon: {
      path: "flags",
      name: "be",
    },
    label: "Belgium",
    value: "BE",
  },
  BZ: {
    icon: {
      path: "flags",
      name: "bz",
    },
    label: "Belize",
    value: "BZ",
  },
  BJ: {
    icon: {
      path: "flags",
      name: "bj",
    },
    label: "Benin",
    value: "BJ",
  },
  BM: {
    icon: {
      path: "flags",
      name: "bm",
    },
    label: "Bermuda",
    value: "BM",
  },
  BT: {
    icon: {
      path: "flags",
      name: "bt",
    },
    label: "Bhutan",
    value: "BT",
  },
  BO: {
    icon: {
      path: "flags",
      name: "bo",
    },
    label: "Bolivia (Plurinational State of)",
    value: "BO",
  },
  BQ: {
    icon: {
      path: "flags",
      name: "bq",
    },
    label: "Bonaire, Sint Eustatius and Saba",
    value: "BQ",
  },
  BA: {
    icon: {
      path: "flags",
      name: "ba",
    },
    label: "Bosnia and Herzegovina",
    value: "BA",
  },
  BW: {
    icon: {
      path: "flags",
      name: "bw",
    },
    label: "Botswana",
    value: "BW",
  },
  BR: {
    icon: {
      path: "flags",
      name: "br",
    },
    label: "Brazil",
    value: "BR",
  },
  IO: {
    icon: {
      path: "flags",
      name: "io",
    },
    label: "British Indian Ocean Territory",
    value: "IO",
  },
  BN: {
    icon: {
      path: "flags",
      name: "bn",
    },
    label: "Brunei Darussalam",
    value: "BN",
  },
  BG: {
    icon: {
      path: "flags",
      name: "bg",
    },
    label: "Bulgaria",
    value: "BG",
  },
  BF: {
    icon: {
      path: "flags",
      name: "bf",
    },
    label: "Burkina Faso",
    value: "BF",
  },
  BI: {
    icon: {
      path: "flags",
      name: "bi",
    },
    label: "Burundi",
    value: "BI",
  },
  CV: {
    icon: {
      path: "flags",
      name: "cv",
    },
    label: "Cabo Verde",
    value: "CV",
  },
  KH: {
    icon: {
      path: "flags",
      name: "kh",
    },
    label: "Cambodia",
    value: "KH",
  },
  CM: {
    icon: {
      path: "flags",
      name: "cm",
    },
    label: "Cameroon",
    value: "CM",
  },
  CA: {
    icon: {
      path: "flags",
      name: "ca",
    },
    label: "Canada",
    value: "CA",
  },
  KY: {
    icon: {
      path: "flags",
      name: "ky",
    },
    label: "Cayman Islands",
    value: "KY",
  },
  CF: {
    icon: {
      path: "flags",
      name: "cf",
    },
    label: "Central African Republic",
    value: "CF",
  },
  TD: {
    icon: {
      path: "flags",
      name: "td",
    },
    label: "Chad",
    value: "TD",
  },
  CL: {
    icon: {
      path: "flags",
      name: "cl",
    },
    label: "Chile",
    value: "CL",
  },
  CN: {
    icon: {
      path: "flags",
      name: "cn",
    },
    label: "China",
    value: "CN",
  },
  CX: {
    icon: {
      path: "flags",
      name: "cx",
    },
    label: "Christmas Island",
    value: "CX",
  },
  CC: {
    icon: {
      path: "flags",
      name: "cc",
    },
    label: "Cocos (Keeling) Islands",
    value: "CC",
  },
  CO: {
    icon: {
      path: "flags",
      name: "co",
    },
    label: "Colombia",
    value: "CO",
  },
  KM: {
    icon: {
      path: "flags",
      name: "km",
    },
    label: "Comoros",
    value: "KM",
  },
  CK: {
    icon: {
      path: "flags",
      name: "ck",
    },
    label: "Cook Islands",
    value: "CK",
  },
  CR: {
    icon: {
      path: "flags",
      name: "cr",
    },
    label: "Costa Rica",
    value: "CR",
  },
  HR: {
    icon: {
      path: "flags",
      name: "hr",
    },
    label: "Croatia",
    value: "HR",
  },
  CU: {
    icon: {
      path: "flags",
      name: "cu",
    },
    label: "Cuba",
    value: "CU",
  },
  CW: {
    icon: {
      path: "flags",
      name: "cw",
    },
    label: "Curaçao",
    value: "CW",
  },
  CY: {
    icon: {
      path: "flags",
      name: "cy",
    },
    label: "Cyprus",
    value: "CY",
  },
  CZ: {
    icon: {
      path: "flags",
      name: "cz",
    },
    label: "Czech Republic",
    value: "CZ",
  },
  CI: {
    icon: {
      path: "flags",
      name: "ci",
    },
    label: "Côte Ivoire",
    value: "CI",
  },
  CD: {
    icon: {
      path: "flags",
      name: "cd",
    },
    label: "Democratic Republic of the Congo",
    value: "CD",
  },
  DK: {
    icon: {
      path: "flags",
      name: "dk",
    },
    label: "Denmark",
    value: "DK",
  },
  DJ: {
    icon: {
      path: "flags",
      name: "dj",
    },
    label: "Djibouti",
    value: "DJ",
  },
  DM: {
    icon: {
      path: "flags",
      name: "dm",
    },
    label: "Dominica",
    value: "DM",
  },
  DO: {
    icon: {
      path: "flags",
      name: "do",
    },
    label: "Dominican Republic",
    value: "DO",
  },
  EC: {
    icon: {
      path: "flags",
      name: "ec",
    },
    label: "Ecuador",
    value: "EC",
  },
  EG: {
    icon: {
      path: "flags",
      name: "eg",
    },
    label: "Egypt",
    value: "EG",
  },
  SV: {
    icon: {
      path: "flags",
      name: "sv",
    },
    label: "El Salvador",
    value: "SV",
  },
  "GB:ENG": {
    icon: {
      path: "flags",
      name: "gb",
    },
    label: "England",
    value: "GB",
  },
  GQ: {
    icon: {
      path: "flags",
      name: "gq",
    },
    label: "Equatorial Guinea",
    value: "GQ",
  },
  ER: {
    icon: {
      path: "flags",
      name: "er",
    },
    label: "Eritrea",
    value: "ER",
  },
  EE: {
    icon: {
      path: "flags",
      name: "ee",
    },
    label: "Estonia",
    value: "EE",
  },
  ET: {
    icon: {
      path: "flags",
      name: "et",
    },
    label: "Ethiopia",
    value: "ET",
  },
  FK: {
    icon: {
      path: "flags",
      name: "fk",
    },
    label: "Falkland Islands",
    value: "FK",
  },
  FO: {
    icon: {
      path: "flags",
      name: "fo",
    },
    label: "Faroe Islands",
    value: "FO",
  },
  FM: {
    icon: {
      path: "flags",
      name: "fm",
    },
    label: "Federated States of Micronesia",
    value: "FM",
  },
  FJ: {
    icon: {
      path: "flags",
      name: "fj",
    },
    label: "Fiji",
    value: "FJ",
  },
  FI: {
    icon: {
      path: "flags",
      name: "fi",
    },
    label: "Finland",
    value: "FI",
  },
  FR: {
    icon: {
      path: "flags",
      name: "fr",
    },
    label: "France",
    value: "FR",
  },
  GF: {
    icon: {
      path: "flags",
      name: "gf",
    },
    label: "French Guiana",
    value: "GF",
  },
  PF: {
    icon: {
      path: "flags",
      name: "pf",
    },
    label: "French Polynesia",
    value: "PF",
  },
  TF: {
    icon: {
      path: "flags",
      name: "tf",
    },
    label: "French Southern Territories",
    value: "TF",
  },
  GA: {
    icon: {
      path: "flags",
      name: "ga",
    },
    label: "Gabon",
    value: "GA",
  },
  GM: {
    icon: {
      path: "flags",
      name: "gm",
    },
    label: "Gambia",
    value: "GM",
  },
  GE: {
    icon: {
      path: "flags",
      name: "ge",
    },
    label: "Georgia",
    value: "GE",
  },
  DE: {
    icon: {
      path: "flags",
      name: "de",
    },
    label: "Germany",
    value: "DE",
  },
  GH: {
    icon: {
      path: "flags",
      name: "gh",
    },
    label: "Ghana",
    value: "GH",
  },
  GI: {
    icon: {
      path: "flags",
      name: "gi",
    },
    label: "Gibraltar",
    value: "GI",
  },
  GR: {
    icon: {
      path: "flags",
      name: "gr",
    },
    label: "Greece",
    value: "GR",
  },
  GL: {
    icon: {
      path: "flags",
      name: "gl",
    },
    label: "Greenland",
    value: "GL",
  },
  GD: {
    icon: {
      path: "flags",
      name: "gd",
    },
    label: "Grenada",
    value: "GD",
  },
  GP: {
    icon: {
      path: "flags",
      name: "gp",
    },
    label: "Guadeloupe",
    value: "GP",
  },
  GU: {
    icon: {
      path: "flags",
      name: "gu",
    },
    label: "Guam",
    value: "GU",
  },
  GT: {
    icon: {
      path: "flags",
      name: "gt",
    },
    label: "Guatemala",
    value: "GT",
  },
  GG: {
    icon: {
      path: "flags",
      name: "gg",
    },
    label: "Guernsey",
    value: "GG",
  },
  GN: {
    icon: {
      path: "flags",
      name: "gn",
    },
    label: "Guinea",
    value: "GN",
  },
  GW: {
    icon: {
      path: "flags",
      name: "gw",
    },
    label: "Guinea-Bissau",
    value: "GW",
  },
  GY: {
    icon: {
      path: "flags",
      name: "gy",
    },
    label: "Guyana",
    value: "GY",
  },
  HT: {
    icon: {
      path: "flags",
      name: "ht",
    },
    label: "Haiti",
    value: "HT",
  },
  VA: {
    icon: {
      path: "flags",
      name: "va",
    },
    label: "Holy See",
    value: "VA",
  },
  HN: {
    icon: {
      path: "flags",
      name: "hn",
    },
    label: "Honduras",
    value: "HN",
  },
  HK: {
    icon: {
      path: "flags",
      name: "hk",
    },
    label: "Hong Kong",
    value: "HK",
  },
  HU: {
    icon: {
      path: "flags",
      name: "hu",
    },
    label: "Hungary",
    value: "HU",
  },
  IS: {
    icon: {
      path: "flags",
      name: "is",
    },
    label: "Iceland",
    value: "IS",
  },
  IN: {
    icon: {
      path: "flags",
      name: "in",
    },
    label: "India",
    value: "IN",
  },
  ID: {
    icon: {
      path: "flags",
      name: "id",
    },
    label: "Indonesia",
    value: "ID",
  },
  IR: {
    icon: {
      path: "flags",
      name: "ir",
    },
    label: "Iran (Islamic Republic of)",
    value: "IR",
  },
  IQ: {
    icon: {
      path: "flags",
      name: "iq",
    },
    label: "Iraq",
    value: "IQ",
  },
  IE: {
    icon: {
      path: "flags",
      name: "ie",
    },
    label: "Ireland",
    value: "IE",
  },
  IM: {
    icon: {
      path: "flags",
      name: "im",
    },
    label: "Isle of Man",
    value: "IM",
  },
  IL: {
    icon: {
      path: "flags",
      name: "il",
    },
    label: "Israel",
    value: "IL",
  },
  IT: {
    icon: {
      path: "flags",
      name: "it",
    },
    label: "Italy",
    value: "IT",
  },
  JM: {
    icon: {
      path: "flags",
      name: "jm",
    },
    label: "Jamaica",
    value: "JM",
  },
  JP: {
    icon: {
      path: "flags",
      name: "jp",
    },
    label: "Japan",
    value: "JP",
  },
  JE: {
    icon: {
      path: "flags",
      name: "je",
    },
    label: "Jersey",
    value: "JE",
  },
  JO: {
    icon: {
      path: "flags",
      name: "jo",
    },
    label: "Jordan",
    value: "JO",
  },
  KZ: {
    icon: {
      path: "flags",
      name: "kz",
    },
    label: "Kazakhstan",
    value: "KZ",
  },
  KE: {
    icon: {
      path: "flags",
      name: "ke",
    },
    label: "Kenya",
    value: "KE",
  },
  KI: {
    icon: {
      path: "flags",
      name: "ki",
    },
    label: "Kiribati",
    value: "KI",
  },
  KW: {
    icon: {
      path: "flags",
      name: "kw",
    },
    label: "Kuwait",
    value: "KW",
  },
  KG: {
    icon: {
      path: "flags",
      name: "kg",
    },
    label: "Kyrgyzstan",
    value: "KG",
  },
  LA: {
    icon: {
      path: "flags",
      name: "la",
    },
    label: "Laos",
    value: "LA",
  },
  LV: {
    icon: {
      path: "flags",
      name: "lv",
    },
    label: "Latvia",
    value: "LV",
  },
  LB: {
    icon: {
      path: "flags",
      name: "lb",
    },
    label: "Lebanon",
    value: "LB",
  },
  LS: {
    icon: {
      path: "flags",
      name: "ls",
    },
    label: "Lesotho",
    value: "LS",
  },
  LR: {
    icon: {
      path: "flags",
      name: "lr",
    },
    label: "Liberia",
    value: "LR",
  },
  LY: {
    icon: {
      path: "flags",
      name: "ly",
    },
    label: "Libya",
    value: "LY",
  },
  LI: {
    icon: {
      path: "flags",
      name: "li",
    },
    label: "Liechtenstein",
    value: "LI",
  },
  LT: {
    icon: {
      path: "flags",
      name: "lt",
    },
    label: "Lithuania",
    value: "LT",
  },
  LU: {
    icon: {
      path: "flags",
      name: "lu",
    },
    label: "Luxembourg",
    value: "LU",
  },
  MO: {
    icon: {
      path: "flags",
      name: "mo",
    },
    label: "Macau",
    value: "MO",
  },
  MG: {
    icon: {
      path: "flags",
      name: "mg",
    },
    label: "Madagascar",
    value: "MG",
  },
  MW: {
    icon: {
      path: "flags",
      name: "mw",
    },
    label: "Malawi",
    value: "MW",
  },
  MY: {
    icon: {
      path: "flags",
      name: "my",
    },
    label: "Malaysia",
    value: "MY",
  },
  MV: {
    icon: {
      path: "flags",
      name: "mv",
    },
    label: "Maldives",
    value: "MV",
  },
  ML: {
    icon: {
      path: "flags",
      name: "ml",
    },
    label: "Mali",
    value: "ML",
  },
  MT: {
    icon: {
      path: "flags",
      name: "mt",
    },
    label: "Malta",
    value: "MT",
  },
  MH: {
    icon: {
      path: "flags",
      name: "mh",
    },
    label: "Marshall Islands",
    value: "MH",
  },
  MQ: {
    icon: {
      path: "flags",
      name: "mq",
    },
    label: "Martinique",
    value: "MQ",
  },
  MR: {
    icon: {
      path: "flags",
      name: "mr",
    },
    label: "Mauritania",
    value: "MR",
  },
  MU: {
    icon: {
      path: "flags",
      name: "mu",
    },
    label: "Mauritius",
    value: "MU",
  },
  YT: {
    icon: {
      path: "flags",
      name: "yt",
    },
    label: "Mayotte",
    value: "YT",
  },
  MX: {
    icon: {
      path: "flags",
      name: "mx",
    },
    label: "Mexico",
    value: "MX",
  },
  MD: {
    icon: {
      path: "flags",
      name: "md",
    },
    label: "Moldova",
    value: "MD",
  },
  MC: {
    icon: {
      path: "flags",
      name: "mc",
    },
    label: "Monaco",
    value: "MC",
  },
  MN: {
    icon: {
      path: "flags",
      name: "mn",
    },
    label: "Mongolia",
    value: "MN",
  },
  ME: {
    icon: {
      path: "flags",
      name: "me",
    },
    label: "Montenegro",
    value: "ME",
  },
  MS: {
    icon: {
      path: "flags",
      name: "ms",
    },
    label: "Montserrat",
    value: "MS",
  },
  MA: {
    icon: {
      path: "flags",
      name: "ma",
    },
    label: "Morocco",
    value: "MA",
  },
  MZ: {
    icon: {
      path: "flags",
      name: "mz",
    },
    label: "Mozambique",
    value: "MZ",
  },
  MM: {
    icon: {
      path: "flags",
      name: "mm",
    },
    label: "Myanmar",
    value: "MM",
  },
  NA: {
    icon: {
      path: "flags",
      name: "na",
    },
    label: "Namibia",
    value: "NA",
  },
  NR: {
    icon: {
      path: "flags",
      name: "nr",
    },
    label: "Nauru",
    value: "NR",
  },
  NP: {
    icon: {
      path: "flags",
      name: "np",
    },
    label: "Nepal",
    value: "NP",
  },
  NL: {
    icon: {
      path: "flags",
      name: "nl",
    },
    label: "Netherlands",
    value: "NL",
  },
  NC: {
    icon: {
      path: "flags",
      name: "nc",
    },
    label: "New Caledonia",
    value: "NC",
  },
  NZ: {
    icon: {
      path: "flags",
      name: "nz",
    },
    label: "New Zealand",
    value: "NZ",
  },
  NI: {
    icon: {
      path: "flags",
      name: "ni",
    },
    label: "Nicaragua",
    value: "NI",
  },
  NE: {
    icon: {
      path: "flags",
      name: "ne",
    },
    label: "Niger",
    value: "NE",
  },
  NG: {
    icon: {
      path: "flags",
      name: "ng",
    },
    label: "Nigeria",
    value: "NG",
  },
  NU: {
    icon: {
      path: "flags",
      name: "nu",
    },
    label: "Niue",
    value: "NU",
  },
  NF: {
    icon: {
      path: "flags",
      name: "nf",
    },
    label: "Norfolk Island",
    value: "NF",
  },
  KP: {
    icon: {
      path: "flags",
      name: "kp",
    },
    label: "North Korea",
    value: "KP",
  },
  MK: {
    icon: {
      path: "flags",
      name: "mk",
    },
    label: "North Macedonia",
    value: "MK",
  },
  "GB:NIR": {
    icon: {
      path: "flags",
      name: "gb",
    },
    label: "Northern Ireland",
    value: "GB",
  },
  MP: {
    icon: {
      path: "flags",
      name: "mp",
    },
    label: "Northern Mariana Islands",
    value: "MP",
  },
  NO: {
    icon: {
      path: "flags",
      name: "no",
    },
    label: "Norway",
    value: "NO",
  },
  OM: {
    icon: {
      path: "flags",
      name: "om",
    },
    label: "Oman",
    value: "OM",
  },
  PK: {
    icon: {
      path: "flags",
      name: "pk",
    },
    label: "Pakistan",
    value: "PK",
  },
  PW: {
    icon: {
      path: "flags",
      name: "pw",
    },
    label: "Palau",
    value: "PW",
  },
  PA: {
    icon: {
      path: "flags",
      name: "pa",
    },
    label: "Panama",
    value: "PA",
  },
  PG: {
    icon: {
      path: "flags",
      name: "pg",
    },
    label: "Papua New Guinea",
    value: "PG",
  },
  PY: {
    icon: {
      path: "flags",
      name: "py",
    },
    label: "Paraguay",
    value: "PY",
  },
  PE: {
    icon: {
      path: "flags",
      name: "pe",
    },
    label: "Peru",
    value: "PE",
  },
  PH: {
    icon: {
      path: "flags",
      name: "ph",
    },
    label: "Philippines",
    value: "PH",
  },
  PN: {
    icon: {
      path: "flags",
      name: "pn",
    },
    label: "Pitcairn",
    value: "PN",
  },
  PL: {
    icon: {
      path: "flags",
      name: "pl",
    },
    label: "Poland",
    value: "PL",
  },
  PT: {
    icon: {
      path: "flags",
      name: "pt",
    },
    label: "Portugal",
    value: "PT",
  },
  PR: {
    icon: {
      path: "flags",
      name: "pr",
    },
    label: "Puerto Rico",
    value: "PR",
  },
  QA: {
    icon: {
      path: "flags",
      name: "qa",
    },
    label: "Qatar",
    value: "QA",
  },
  CG: {
    icon: {
      path: "flags",
      name: "cg",
    },
    label: "Republic of the Congo",
    value: "CG",
  },
  RO: {
    icon: {
      path: "flags",
      name: "ro",
    },
    label: "Romania",
    value: "RO",
  },
  RU: {
    icon: {
      path: "flags",
      name: "ru",
    },
    label: "Russia",
    value: "RU",
  },
  RW: {
    icon: {
      path: "flags",
      name: "rw",
    },
    label: "Rwanda",
    value: "RW",
  },
  RE: {
    icon: {
      path: "flags",
      name: "re",
    },
    label: "Réunion",
    value: "RE",
  },
  BL: {
    icon: {
      path: "flags",
      name: "bl",
    },
    label: "Saint Barthélemy",
    value: "BL",
  },
  SH: {
    icon: {
      path: "flags",
      name: "sh",
    },
    label: "Saint Helena, Ascension and Tristan da Cunha",
    value: "SH",
  },
  KN: {
    icon: {
      path: "flags",
      name: "kn",
    },
    label: "Saint Kitts and Nevis",
    value: "KN",
  },
  LC: {
    icon: {
      path: "flags",
      name: "lc",
    },
    label: "Saint Lucia",
    value: "LC",
  },
  MF: {
    icon: {
      path: "flags",
      name: "mf",
    },
    label: "Saint Martin",
    value: "MF",
  },
  PM: {
    icon: {
      path: "flags",
      name: "pm",
    },
    label: "Saint Pierre and Miquelon",
    value: "PM",
  },
  VC: {
    icon: {
      path: "flags",
      name: "vc",
    },
    label: "Saint Vincent and the Grenadines",
    value: "VC",
  },
  WS: {
    icon: {
      path: "flags",
      name: "ws",
    },
    label: "Samoa",
    value: "WS",
  },
  SM: {
    icon: {
      path: "flags",
      name: "sm",
    },
    label: "San Marino",
    value: "SM",
  },
  ST: {
    icon: {
      path: "flags",
      name: "st",
    },
    label: "Sao Tome and Principe",
    value: "ST",
  },
  SA: {
    icon: {
      path: "flags",
      name: "sa",
    },
    label: "Saudi Arabia",
    value: "SA",
  },
  "GB:SCT": {
    icon: {
      path: "flags",
      name: "gb",
    },
    label: "Scotland",
    value: "GB",
  },
  SN: {
    icon: {
      path: "flags",
      name: "sn",
    },
    label: "Senegal",
    value: "SN",
  },
  RS: {
    icon: {
      path: "flags",
      name: "rs",
    },
    label: "Serbia",
    value: "RS",
  },
  SC: {
    icon: {
      path: "flags",
      name: "sc",
    },
    label: "Seychelles",
    value: "SC",
  },
  SL: {
    icon: {
      path: "flags",
      name: "sl",
    },
    label: "Sierra Leone",
    value: "SL",
  },
  SG: {
    icon: {
      path: "flags",
      name: "sg",
    },
    label: "Singapore",
    value: "SG",
  },
  SX: {
    icon: {
      path: "flags",
      name: "sx",
    },
    label: "Sint Maarten",
    value: "SX",
  },
  SK: {
    icon: {
      path: "flags",
      name: "sk",
    },
    label: "Slovakia",
    value: "SK",
  },
  SI: {
    icon: {
      path: "flags",
      name: "si",
    },
    label: "Slovenia",
    value: "SI",
  },
  SB: {
    icon: {
      path: "flags",
      name: "sb",
    },
    label: "Solomon Islands",
    value: "SB",
  },
  SO: {
    icon: {
      path: "flags",
      name: "so",
    },
    label: "Somalia",
    value: "SO",
  },
  ZA: {
    icon: {
      path: "flags",
      name: "za",
    },
    label: "South Africa",
    value: "ZA",
  },
  GS: {
    icon: {
      path: "flags",
      name: "gs",
    },
    label: "South Georgia and the South Sandwich Islands",
    value: "GS",
  },
  KR: {
    icon: {
      path: "flags",
      name: "kr",
    },
    label: "South Korea",
    value: "KR",
  },
  SS: {
    icon: {
      path: "flags",
      name: "ss",
    },
    label: "South Sudan",
    value: "SS",
  },
  ES: {
    icon: {
      path: "flags",
      name: "es",
    },
    label: "Spain",
    value: "ES",
  },
  LK: {
    icon: {
      path: "flags",
      name: "lk",
    },
    label: "Sri Lanka",
    value: "LK",
  },
  PS: {
    icon: {
      path: "flags",
      name: "ps",
    },
    label: "State of Palestine",
    value: "PS",
  },
  SD: {
    icon: {
      path: "flags",
      name: "sd",
    },
    label: "Sudan",
    value: "SD",
  },
  SR: {
    icon: {
      path: "flags",
      name: "sr",
    },
    label: "Suriname",
    value: "SR",
  },
  SJ: {
    icon: {
      path: "flags",
      name: "sj",
    },
    label: "Svalbard and Jan Mayen",
    value: "SJ",
  },
  SZ: {
    icon: {
      path: "flags",
      name: "sz",
    },
    label: "Swaziland",
    value: "SZ",
  },
  SE: {
    icon: {
      path: "flags",
      name: "se",
    },
    label: "Sweden",
    value: "SE",
  },
  CH: {
    icon: {
      path: "flags",
      name: "ch",
    },
    label: "Switzerland",
    value: "CH",
  },
  SY: {
    icon: {
      path: "flags",
      name: "sy",
    },
    label: "Syrian Arab Republic",
    value: "SY",
  },
  TW: {
    icon: {
      path: "flags",
      name: "tw",
    },
    label: "Taiwan",
    value: "TW",
  },
  TJ: {
    icon: {
      path: "flags",
      name: "tj",
    },
    label: "Tajikistan",
    value: "TJ",
  },
  TZ: {
    icon: {
      path: "flags",
      name: "tz",
    },
    label: "Tanzania",
    value: "TZ",
  },
  TH: {
    icon: {
      path: "flags",
      name: "th",
    },
    label: "Thailand",
    value: "TH",
  },
  TL: {
    icon: {
      path: "flags",
      name: "tl",
    },
    label: "Timor-Leste",
    value: "TL",
  },
  TG: {
    icon: {
      path: "flags",
      name: "tg",
    },
    label: "Togo",
    value: "TG",
  },
  TK: {
    icon: {
      path: "flags",
      name: "tk",
    },
    label: "Tokelau",
    value: "TK",
  },
  TO: {
    icon: {
      path: "flags",
      name: "to",
    },
    label: "Tonga",
    value: "TO",
  },
  TT: {
    icon: {
      path: "flags",
      name: "tt",
    },
    label: "Trinidad and Tobago",
    value: "TT",
  },
  TN: {
    icon: {
      path: "flags",
      name: "tn",
    },
    label: "Tunisia",
    value: "TN",
  },
  TR: {
    icon: {
      path: "flags",
      name: "tr",
    },
    label: "Turkey",
    value: "TR",
  },
  TM: {
    icon: {
      path: "flags",
      name: "tm",
    },
    label: "Turkmenistan",
    value: "TM",
  },
  TC: {
    icon: {
      path: "flags",
      name: "tc",
    },
    label: "Turks and Caicos Islands",
    value: "TC",
  },
  TV: {
    icon: {
      path: "flags",
      name: "tv",
    },
    label: "Tuvalu",
    value: "TV",
  },
  UG: {
    icon: {
      path: "flags",
      name: "ug",
    },
    label: "Uganda",
    value: "UG",
  },
  UA: {
    icon: {
      path: "flags",
      name: "ua",
    },
    label: "Ukraine",
    value: "UA",
  },
  AE: {
    icon: {
      path: "flags",
      name: "ae",
    },
    label: "United Arab Emirates",
    value: "AE",
  },
  GB: {
    icon: {
      path: "flags",
      name: "gb",
    },
    label: "United Kingdom",
    value: "GB",
  },
  UM: {
    icon: {
      path: "flags",
      name: "um",
    },
    label: "United States Minor Outlying Islands",
    value: "UM",
  },
  US: {
    icon: {
      path: "flags",
      name: "us",
    },
    label: "United States of America",
    value: "US",
  },
  UY: {
    icon: {
      path: "flags",
      name: "uy",
    },
    label: "Uruguay",
    value: "UY",
  },
  UZ: {
    icon: {
      path: "flags",
      name: "uz",
    },
    label: "Uzbekistan",
    value: "UZ",
  },
  VU: {
    icon: {
      path: "flags",
      name: "vu",
    },
    label: "Vanuatu",
    value: "VU",
  },
  VE: {
    icon: {
      path: "flags",
      name: "ve",
    },
    label: "Venezuela (Bolivarian Republic of)",
    value: "VE",
  },
  VN: {
    icon: {
      path: "flags",
      name: "vn",
    },
    label: "Vietnam",
    value: "VN",
  },
  VG: {
    icon: {
      path: "flags",
      name: "vg",
    },
    label: "Virgin Islands (British)",
    value: "VG",
  },
  VI: {
    icon: {
      path: "flags",
      name: "vi",
    },
    label: "Virgin Islands (U.S.)",
    value: "VI",
  },
  "GB:WLS": {
    icon: {
      path: "flags",
      name: "gb",
    },
    label: "Wales",
    value: "GB",
  },
  WF: {
    icon: {
      path: "flags",
      name: "wf",
    },
    label: "Wallis and Futuna",
    value: "WF",
  },
  EH: {
    icon: {
      path: "flags",
      name: "eh",
    },
    label: "Western Sahara",
    value: "EH",
  },
  YE: {
    icon: {
      path: "flags",
      name: "ye",
    },
    label: "Yemen",
    value: "YE",
  },
  ZM: {
    icon: {
      path: "flags",
      name: "zm",
    },
    label: "Zambia",
    value: "ZM",
  },
  ZW: {
    icon: {
      path: "flags",
      name: "zw",
    },
    label: "Zimbabwe",
    value: "ZW",
  },
};
</script>
