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
      name: "AF",
    },
    label: "Afghanistan",
    value: "AF",
  },
  AX: {
    icon: {
      path: "flags",
      name: "AX",
    },
    label: "Aland Islands",
    value: "AX",
  },
  AL: {
    icon: {
      path: "flags",
      name: "AL",
    },
    label: "Albania",
    value: "AL",
  },
  DZ: {
    icon: {
      path: "flags",
      name: "DZ",
    },
    label: "Algeria",
    value: "DZ",
  },
  AS: {
    icon: {
      path: "flags",
      name: "AS",
    },
    label: "American Samoa",
    value: "AS",
  },
  AD: {
    icon: {
      path: "flags",
      name: "AD",
    },
    label: "Andorra",
    value: "AD",
  },
  AO: {
    icon: {
      path: "flags",
      name: "AO",
    },
    label: "Angola",
    value: "AO",
  },
  AI: {
    icon: {
      path: "flags",
      name: "AI",
    },
    label: "Anguilla",
    value: "AI",
  },
  AG: {
    icon: {
      path: "flags",
      name: "AG",
    },
    label: "Antigua and Barbuda",
    value: "AG",
  },
  AR: {
    icon: {
      path: "flags",
      name: "AR",
    },
    label: "Argentina",
    value: "AR",
  },
  AM: {
    icon: {
      path: "flags",
      name: "AM",
    },
    label: "Armenia",
    value: "AM",
  },
  AW: {
    icon: {
      path: "flags",
      name: "AW",
    },
    label: "Aruba",
    value: "AW",
  },
  AU: {
    icon: {
      path: "flags",
      name: "AU",
    },
    label: "Australia",
    value: "AU",
  },
  AT: {
    icon: {
      path: "flags",
      name: "AT",
    },
    label: "Austria",
    value: "AT",
  },
  AZ: {
    icon: {
      path: "flags",
      name: "AZ",
    },
    label: "Azerbaijan",
    value: "AZ",
  },
  BS: {
    icon: {
      path: "flags",
      name: "BS",
    },
    label: "Bahamas",
    value: "BS",
  },
  BH: {
    icon: {
      path: "flags",
      name: "BH",
    },
    label: "Bahrain",
    value: "BH",
  },
  BD: {
    icon: {
      path: "flags",
      name: "BD",
    },
    label: "Bangladesh",
    value: "BD",
  },
  BB: {
    icon: {
      path: "flags",
      name: "BB",
    },
    label: "Barbados",
    value: "BB",
  },
  BY: {
    icon: {
      path: "flags",
      name: "BY",
    },
    label: "Belarus",
    value: "BY",
  },
  BE: {
    icon: {
      path: "flags",
      name: "BE",
    },
    label: "Belgium",
    value: "BE",
  },
  BZ: {
    icon: {
      path: "flags",
      name: "BZ",
    },
    label: "Belize",
    value: "BZ",
  },
  BJ: {
    icon: {
      path: "flags",
      name: "BJ",
    },
    label: "Benin",
    value: "BJ",
  },
  BM: {
    icon: {
      path: "flags",
      name: "BM",
    },
    label: "Bermuda",
    value: "BM",
  },
  BT: {
    icon: {
      path: "flags",
      name: "BT",
    },
    label: "Bhutan",
    value: "BT",
  },
  BO: {
    icon: {
      path: "flags",
      name: "BO",
    },
    label: "Bolivia (Plurinational State of)",
    value: "BO",
  },
  BQ: {
    icon: {
      path: "flags",
      name: "BQ",
    },
    label: "Bonaire, Sint Eustatius and Saba",
    value: "BQ",
  },
  BA: {
    icon: {
      path: "flags",
      name: "BA",
    },
    label: "Bosnia and Herzegovina",
    value: "BA",
  },
  BW: {
    icon: {
      path: "flags",
      name: "BW",
    },
    label: "Botswana",
    value: "BW",
  },
  BR: {
    icon: {
      path: "flags",
      name: "BR",
    },
    label: "Brazil",
    value: "BR",
  },
  IO: {
    icon: {
      path: "flags",
      name: "IO",
    },
    label: "British Indian Ocean Territory",
    value: "IO",
  },
  BN: {
    icon: {
      path: "flags",
      name: "BN",
    },
    label: "Brunei Darussalam",
    value: "BN",
  },
  BG: {
    icon: {
      path: "flags",
      name: "BG",
    },
    label: "Bulgaria",
    value: "BG",
  },
  BF: {
    icon: {
      path: "flags",
      name: "BF",
    },
    label: "Burkina Faso",
    value: "BF",
  },
  BI: {
    icon: {
      path: "flags",
      name: "BI",
    },
    label: "Burundi",
    value: "BI",
  },
  CV: {
    icon: {
      path: "flags",
      name: "CV",
    },
    label: "Cabo Verde",
    value: "CV",
  },
  KH: {
    icon: {
      path: "flags",
      name: "KH",
    },
    label: "Cambodia",
    value: "KH",
  },
  CM: {
    icon: {
      path: "flags",
      name: "CM",
    },
    label: "Cameroon",
    value: "CM",
  },
  CA: {
    icon: {
      path: "flags",
      name: "CA",
    },
    label: "Canada",
    value: "CA",
  },
  KY: {
    icon: {
      path: "flags",
      name: "KY",
    },
    label: "Cayman Islands",
    value: "KY",
  },
  CF: {
    icon: {
      path: "flags",
      name: "CF",
    },
    label: "Central African Republic",
    value: "CF",
  },
  TD: {
    icon: {
      path: "flags",
      name: "TD",
    },
    label: "Chad",
    value: "TD",
  },
  CL: {
    icon: {
      path: "flags",
      name: "CL",
    },
    label: "Chile",
    value: "CL",
  },
  CN: {
    icon: {
      path: "flags",
      name: "CN",
    },
    label: "China",
    value: "CN",
  },
  CX: {
    icon: {
      path: "flags",
      name: "CX",
    },
    label: "Christmas Island",
    value: "CX",
  },
  CC: {
    icon: {
      path: "flags",
      name: "CC",
    },
    label: "Cocos (Keeling) Islands",
    value: "CC",
  },
  CO: {
    icon: {
      path: "flags",
      name: "CO",
    },
    label: "Colombia",
    value: "CO",
  },
  KM: {
    icon: {
      path: "flags",
      name: "KM",
    },
    label: "Comoros",
    value: "KM",
  },
  CK: {
    icon: {
      path: "flags",
      name: "CK",
    },
    label: "Cook Islands",
    value: "CK",
  },
  CR: {
    icon: {
      path: "flags",
      name: "CR",
    },
    label: "Costa Rica",
    value: "CR",
  },
  HR: {
    icon: {
      path: "flags",
      name: "HR",
    },
    label: "Croatia",
    value: "HR",
  },
  CU: {
    icon: {
      path: "flags",
      name: "CU",
    },
    label: "Cuba",
    value: "CU",
  },
  CW: {
    icon: {
      path: "flags",
      name: "CW",
    },
    label: "Curaçao",
    value: "CW",
  },
  CY: {
    icon: {
      path: "flags",
      name: "CY",
    },
    label: "Cyprus",
    value: "CY",
  },
  CZ: {
    icon: {
      path: "flags",
      name: "CZ",
    },
    label: "Czech Republic",
    value: "CZ",
  },
  CI: {
    icon: {
      path: "flags",
      name: "CI",
    },
    label: "Côte Ivoire",
    value: "CI",
  },
  CD: {
    icon: {
      path: "flags",
      name: "CD",
    },
    label: "Democratic Republic of the Congo",
    value: "CD",
  },
  DK: {
    icon: {
      path: "flags",
      name: "DK",
    },
    label: "Denmark",
    value: "DK",
  },
  DJ: {
    icon: {
      path: "flags",
      name: "DJ",
    },
    label: "Djibouti",
    value: "DJ",
  },
  DM: {
    icon: {
      path: "flags",
      name: "DM",
    },
    label: "Dominica",
    value: "DM",
  },
  DO: {
    icon: {
      path: "flags",
      name: "DO",
    },
    label: "Dominican Republic",
    value: "DO",
  },
  EC: {
    icon: {
      path: "flags",
      name: "EC",
    },
    label: "Ecuador",
    value: "EC",
  },
  EG: {
    icon: {
      path: "flags",
      name: "EG",
    },
    label: "Egypt",
    value: "EG",
  },
  SV: {
    icon: {
      path: "flags",
      name: "SV",
    },
    label: "El Salvador",
    value: "SV",
  },
  "GB:ENG": {
    icon: {
      path: "flags",
      name: "GB",
    },
    label: "England",
    value: "GB",
  },
  GQ: {
    icon: {
      path: "flags",
      name: "GQ",
    },
    label: "Equatorial Guinea",
    value: "GQ",
  },
  ER: {
    icon: {
      path: "flags",
      name: "ER",
    },
    label: "Eritrea",
    value: "ER",
  },
  EE: {
    icon: {
      path: "flags",
      name: "EE",
    },
    label: "Estonia",
    value: "EE",
  },
  ET: {
    icon: {
      path: "flags",
      name: "ET",
    },
    label: "Ethiopia",
    value: "ET",
  },
  FK: {
    icon: {
      path: "flags",
      name: "FK",
    },
    label: "Falkland Islands",
    value: "FK",
  },
  FO: {
    icon: {
      path: "flags",
      name: "FO",
    },
    label: "Faroe Islands",
    value: "FO",
  },
  FM: {
    icon: {
      path: "flags",
      name: "FM",
    },
    label: "Federated States of Micronesia",
    value: "FM",
  },
  FJ: {
    icon: {
      path: "flags",
      name: "FJ",
    },
    label: "Fiji",
    value: "FJ",
  },
  FI: {
    icon: {
      path: "flags",
      name: "FI",
    },
    label: "Finland",
    value: "FI",
  },
  FR: {
    icon: {
      path: "flags",
      name: "FR",
    },
    label: "France",
    value: "FR",
  },
  GF: {
    icon: {
      path: "flags",
      name: "GF",
    },
    label: "French Guiana",
    value: "GF",
  },
  PF: {
    icon: {
      path: "flags",
      name: "PF",
    },
    label: "French Polynesia",
    value: "PF",
  },
  TF: {
    icon: {
      path: "flags",
      name: "TF",
    },
    label: "French Southern Territories",
    value: "TF",
  },
  GA: {
    icon: {
      path: "flags",
      name: "GA",
    },
    label: "Gabon",
    value: "GA",
  },
  GM: {
    icon: {
      path: "flags",
      name: "GM",
    },
    label: "Gambia",
    value: "GM",
  },
  GE: {
    icon: {
      path: "flags",
      name: "GE",
    },
    label: "Georgia",
    value: "GE",
  },
  DE: {
    icon: {
      path: "flags",
      name: "DE",
    },
    label: "Germany",
    value: "DE",
  },
  GH: {
    icon: {
      path: "flags",
      name: "GH",
    },
    label: "Ghana",
    value: "GH",
  },
  GI: {
    icon: {
      path: "flags",
      name: "GI",
    },
    label: "Gibraltar",
    value: "GI",
  },
  GR: {
    icon: {
      path: "flags",
      name: "GR",
    },
    label: "Greece",
    value: "GR",
  },
  GL: {
    icon: {
      path: "flags",
      name: "GL",
    },
    label: "Greenland",
    value: "GL",
  },
  GD: {
    icon: {
      path: "flags",
      name: "GD",
    },
    label: "Grenada",
    value: "GD",
  },
  GP: {
    icon: {
      path: "flags",
      name: "GP",
    },
    label: "Guadeloupe",
    value: "GP",
  },
  GU: {
    icon: {
      path: "flags",
      name: "GU",
    },
    label: "Guam",
    value: "GU",
  },
  GT: {
    icon: {
      path: "flags",
      name: "GT",
    },
    label: "Guatemala",
    value: "GT",
  },
  GG: {
    icon: {
      path: "flags",
      name: "GG",
    },
    label: "Guernsey",
    value: "GG",
  },
  GN: {
    icon: {
      path: "flags",
      name: "GN",
    },
    label: "Guinea",
    value: "GN",
  },
  GW: {
    icon: {
      path: "flags",
      name: "GW",
    },
    label: "Guinea-Bissau",
    value: "GW",
  },
  GY: {
    icon: {
      path: "flags",
      name: "GY",
    },
    label: "Guyana",
    value: "GY",
  },
  HT: {
    icon: {
      path: "flags",
      name: "HT",
    },
    label: "Haiti",
    value: "HT",
  },
  VA: {
    icon: {
      path: "flags",
      name: "VA",
    },
    label: "Holy See",
    value: "VA",
  },
  HN: {
    icon: {
      path: "flags",
      name: "HN",
    },
    label: "Honduras",
    value: "HN",
  },
  HK: {
    icon: {
      path: "flags",
      name: "HK",
    },
    label: "Hong Kong",
    value: "HK",
  },
  HU: {
    icon: {
      path: "flags",
      name: "HU",
    },
    label: "Hungary",
    value: "HU",
  },
  IS: {
    icon: {
      path: "flags",
      name: "IS",
    },
    label: "Iceland",
    value: "IS",
  },
  IN: {
    icon: {
      path: "flags",
      name: "IN",
    },
    label: "India",
    value: "IN",
  },
  ID: {
    icon: {
      path: "flags",
      name: "ID",
    },
    label: "Indonesia",
    value: "ID",
  },
  IR: {
    icon: {
      path: "flags",
      name: "IR",
    },
    label: "Iran (Islamic Republic of)",
    value: "IR",
  },
  IQ: {
    icon: {
      path: "flags",
      name: "IQ",
    },
    label: "Iraq",
    value: "IQ",
  },
  IE: {
    icon: {
      path: "flags",
      name: "IE",
    },
    label: "Ireland",
    value: "IE",
  },
  IM: {
    icon: {
      path: "flags",
      name: "IM",
    },
    label: "Isle of Man",
    value: "IM",
  },
  IL: {
    icon: {
      path: "flags",
      name: "IL",
    },
    label: "Israel",
    value: "IL",
  },
  IT: {
    icon: {
      path: "flags",
      name: "IT",
    },
    label: "Italy",
    value: "IT",
  },
  JM: {
    icon: {
      path: "flags",
      name: "JM",
    },
    label: "Jamaica",
    value: "JM",
  },
  JP: {
    icon: {
      path: "flags",
      name: "JP",
    },
    label: "Japan",
    value: "JP",
  },
  JE: {
    icon: {
      path: "flags",
      name: "JE",
    },
    label: "Jersey",
    value: "JE",
  },
  JO: {
    icon: {
      path: "flags",
      name: "JO",
    },
    label: "Jordan",
    value: "JO",
  },
  KZ: {
    icon: {
      path: "flags",
      name: "KZ",
    },
    label: "Kazakhstan",
    value: "KZ",
  },
  KE: {
    icon: {
      path: "flags",
      name: "KE",
    },
    label: "Kenya",
    value: "KE",
  },
  KI: {
    icon: {
      path: "flags",
      name: "KI",
    },
    label: "Kiribati",
    value: "KI",
  },
  KW: {
    icon: {
      path: "flags",
      name: "KW",
    },
    label: "Kuwait",
    value: "KW",
  },
  KG: {
    icon: {
      path: "flags",
      name: "KG",
    },
    label: "Kyrgyzstan",
    value: "KG",
  },
  LA: {
    icon: {
      path: "flags",
      name: "LA",
    },
    label: "Laos",
    value: "LA",
  },
  LV: {
    icon: {
      path: "flags",
      name: "LV",
    },
    label: "Latvia",
    value: "LV",
  },
  LB: {
    icon: {
      path: "flags",
      name: "LB",
    },
    label: "Lebanon",
    value: "LB",
  },
  LS: {
    icon: {
      path: "flags",
      name: "LS",
    },
    label: "Lesotho",
    value: "LS",
  },
  LR: {
    icon: {
      path: "flags",
      name: "LR",
    },
    label: "Liberia",
    value: "LR",
  },
  LY: {
    icon: {
      path: "flags",
      name: "LY",
    },
    label: "Libya",
    value: "LY",
  },
  LI: {
    icon: {
      path: "flags",
      name: "LI",
    },
    label: "Liechtenstein",
    value: "LI",
  },
  LT: {
    icon: {
      path: "flags",
      name: "LT",
    },
    label: "Lithuania",
    value: "LT",
  },
  LU: {
    icon: {
      path: "flags",
      name: "LU",
    },
    label: "Luxembourg",
    value: "LU",
  },
  MO: {
    icon: {
      path: "flags",
      name: "MO",
    },
    label: "Macau",
    value: "MO",
  },
  MG: {
    icon: {
      path: "flags",
      name: "MG",
    },
    label: "Madagascar",
    value: "MG",
  },
  MW: {
    icon: {
      path: "flags",
      name: "MW",
    },
    label: "Malawi",
    value: "MW",
  },
  MY: {
    icon: {
      path: "flags",
      name: "MY",
    },
    label: "Malaysia",
    value: "MY",
  },
  MV: {
    icon: {
      path: "flags",
      name: "MV",
    },
    label: "Maldives",
    value: "MV",
  },
  ML: {
    icon: {
      path: "flags",
      name: "ML",
    },
    label: "Mali",
    value: "ML",
  },
  MT: {
    icon: {
      path: "flags",
      name: "MT",
    },
    label: "Malta",
    value: "MT",
  },
  MH: {
    icon: {
      path: "flags",
      name: "MH",
    },
    label: "Marshall Islands",
    value: "MH",
  },
  MQ: {
    icon: {
      path: "flags",
      name: "MQ",
    },
    label: "Martinique",
    value: "MQ",
  },
  MR: {
    icon: {
      path: "flags",
      name: "MR",
    },
    label: "Mauritania",
    value: "MR",
  },
  MU: {
    icon: {
      path: "flags",
      name: "MU",
    },
    label: "Mauritius",
    value: "MU",
  },
  YT: {
    icon: {
      path: "flags",
      name: "YT",
    },
    label: "Mayotte",
    value: "YT",
  },
  MX: {
    icon: {
      path: "flags",
      name: "MX",
    },
    label: "Mexico",
    value: "MX",
  },
  MD: {
    icon: {
      path: "flags",
      name: "MD",
    },
    label: "Moldova",
    value: "MD",
  },
  MC: {
    icon: {
      path: "flags",
      name: "MC",
    },
    label: "Monaco",
    value: "MC",
  },
  MN: {
    icon: {
      path: "flags",
      name: "MN",
    },
    label: "Mongolia",
    value: "MN",
  },
  ME: {
    icon: {
      path: "flags",
      name: "ME",
    },
    label: "Montenegro",
    value: "ME",
  },
  MS: {
    icon: {
      path: "flags",
      name: "MS",
    },
    label: "Montserrat",
    value: "MS",
  },
  MA: {
    icon: {
      path: "flags",
      name: "MA",
    },
    label: "Morocco",
    value: "MA",
  },
  MZ: {
    icon: {
      path: "flags",
      name: "MZ",
    },
    label: "Mozambique",
    value: "MZ",
  },
  MM: {
    icon: {
      path: "flags",
      name: "MM",
    },
    label: "Myanmar",
    value: "MM",
  },
  NA: {
    icon: {
      path: "flags",
      name: "NA",
    },
    label: "Namibia",
    value: "NA",
  },
  NR: {
    icon: {
      path: "flags",
      name: "NR",
    },
    label: "Nauru",
    value: "NR",
  },
  NP: {
    icon: {
      path: "flags",
      name: "NP",
    },
    label: "Nepal",
    value: "NP",
  },
  NL: {
    icon: {
      path: "flags",
      name: "NL",
    },
    label: "Netherlands",
    value: "NL",
  },
  NC: {
    icon: {
      path: "flags",
      name: "NC",
    },
    label: "New Caledonia",
    value: "NC",
  },
  NZ: {
    icon: {
      path: "flags",
      name: "NZ",
    },
    label: "New Zealand",
    value: "NZ",
  },
  NI: {
    icon: {
      path: "flags",
      name: "NI",
    },
    label: "Nicaragua",
    value: "NI",
  },
  NE: {
    icon: {
      path: "flags",
      name: "NE",
    },
    label: "Niger",
    value: "NE",
  },
  NG: {
    icon: {
      path: "flags",
      name: "NG",
    },
    label: "Nigeria",
    value: "NG",
  },
  NU: {
    icon: {
      path: "flags",
      name: "NU",
    },
    label: "Niue",
    value: "NU",
  },
  NF: {
    icon: {
      path: "flags",
      name: "NF",
    },
    label: "Norfolk Island",
    value: "NF",
  },
  KP: {
    icon: {
      path: "flags",
      name: "KP",
    },
    label: "North Korea",
    value: "KP",
  },
  MK: {
    icon: {
      path: "flags",
      name: "MK",
    },
    label: "North Macedonia",
    value: "MK",
  },
  "GB:NIR": {
    icon: {
      path: "flags",
      name: "GB",
    },
    label: "Northern Ireland",
    value: "GB",
  },
  MP: {
    icon: {
      path: "flags",
      name: "MP",
    },
    label: "Northern Mariana Islands",
    value: "MP",
  },
  NO: {
    icon: {
      path: "flags",
      name: "NO",
    },
    label: "Norway",
    value: "NO",
  },
  OM: {
    icon: {
      path: "flags",
      name: "OM",
    },
    label: "Oman",
    value: "OM",
  },
  PK: {
    icon: {
      path: "flags",
      name: "PK",
    },
    label: "Pakistan",
    value: "PK",
  },
  PW: {
    icon: {
      path: "flags",
      name: "PW",
    },
    label: "Palau",
    value: "PW",
  },
  PA: {
    icon: {
      path: "flags",
      name: "PA",
    },
    label: "Panama",
    value: "PA",
  },
  PG: {
    icon: {
      path: "flags",
      name: "PG",
    },
    label: "Papua New Guinea",
    value: "PG",
  },
  PY: {
    icon: {
      path: "flags",
      name: "PY",
    },
    label: "Paraguay",
    value: "PY",
  },
  PE: {
    icon: {
      path: "flags",
      name: "PE",
    },
    label: "Peru",
    value: "PE",
  },
  PH: {
    icon: {
      path: "flags",
      name: "PH",
    },
    label: "Philippines",
    value: "PH",
  },
  PN: {
    icon: {
      path: "flags",
      name: "PN",
    },
    label: "Pitcairn",
    value: "PN",
  },
  PL: {
    icon: {
      path: "flags",
      name: "PL",
    },
    label: "Poland",
    value: "PL",
  },
  PT: {
    icon: {
      path: "flags",
      name: "PT",
    },
    label: "Portugal",
    value: "PT",
  },
  PR: {
    icon: {
      path: "flags",
      name: "PR",
    },
    label: "Puerto Rico",
    value: "PR",
  },
  QA: {
    icon: {
      path: "flags",
      name: "QA",
    },
    label: "Qatar",
    value: "QA",
  },
  CG: {
    icon: {
      path: "flags",
      name: "CG",
    },
    label: "Republic of the Congo",
    value: "CG",
  },
  RO: {
    icon: {
      path: "flags",
      name: "RO",
    },
    label: "Romania",
    value: "RO",
  },
  RU: {
    icon: {
      path: "flags",
      name: "RU",
    },
    label: "Russia",
    value: "RU",
  },
  RW: {
    icon: {
      path: "flags",
      name: "RW",
    },
    label: "Rwanda",
    value: "RW",
  },
  RE: {
    icon: {
      path: "flags",
      name: "RE",
    },
    label: "Réunion",
    value: "RE",
  },
  BL: {
    icon: {
      path: "flags",
      name: "BL",
    },
    label: "Saint Barthélemy",
    value: "BL",
  },
  SH: {
    icon: {
      path: "flags",
      name: "SH",
    },
    label: "Saint Helena, Ascension and Tristan da Cunha",
    value: "SH",
  },
  KN: {
    icon: {
      path: "flags",
      name: "KN",
    },
    label: "Saint Kitts and Nevis",
    value: "KN",
  },
  LC: {
    icon: {
      path: "flags",
      name: "LC",
    },
    label: "Saint Lucia",
    value: "LC",
  },
  MF: {
    icon: {
      path: "flags",
      name: "MF",
    },
    label: "Saint Martin",
    value: "MF",
  },
  PM: {
    icon: {
      path: "flags",
      name: "PM",
    },
    label: "Saint Pierre and Miquelon",
    value: "PM",
  },
  VC: {
    icon: {
      path: "flags",
      name: "VC",
    },
    label: "Saint Vincent and the Grenadines",
    value: "VC",
  },
  WS: {
    icon: {
      path: "flags",
      name: "WS",
    },
    label: "Samoa",
    value: "WS",
  },
  SM: {
    icon: {
      path: "flags",
      name: "SM",
    },
    label: "San Marino",
    value: "SM",
  },
  ST: {
    icon: {
      path: "flags",
      name: "ST",
    },
    label: "Sao Tome and Principe",
    value: "ST",
  },
  SA: {
    icon: {
      path: "flags",
      name: "SA",
    },
    label: "Saudi Arabia",
    value: "SA",
  },
  "GB:SCT": {
    icon: {
      path: "flags",
      name: "GB",
    },
    label: "Scotland",
    value: "GB",
  },
  SN: {
    icon: {
      path: "flags",
      name: "SN",
    },
    label: "Senegal",
    value: "SN",
  },
  RS: {
    icon: {
      path: "flags",
      name: "RS",
    },
    label: "Serbia",
    value: "RS",
  },
  SC: {
    icon: {
      path: "flags",
      name: "SC",
    },
    label: "Seychelles",
    value: "SC",
  },
  SL: {
    icon: {
      path: "flags",
      name: "SL",
    },
    label: "Sierra Leone",
    value: "SL",
  },
  SG: {
    icon: {
      path: "flags",
      name: "SG",
    },
    label: "Singapore",
    value: "SG",
  },
  SX: {
    icon: {
      path: "flags",
      name: "SX",
    },
    label: "Sint Maarten",
    value: "SX",
  },
  SK: {
    icon: {
      path: "flags",
      name: "SK",
    },
    label: "Slovakia",
    value: "SK",
  },
  SI: {
    icon: {
      path: "flags",
      name: "SI",
    },
    label: "Slovenia",
    value: "SI",
  },
  SB: {
    icon: {
      path: "flags",
      name: "SB",
    },
    label: "Solomon Islands",
    value: "SB",
  },
  SO: {
    icon: {
      path: "flags",
      name: "SO",
    },
    label: "Somalia",
    value: "SO",
  },
  ZA: {
    icon: {
      path: "flags",
      name: "ZA",
    },
    label: "South Africa",
    value: "ZA",
  },
  GS: {
    icon: {
      path: "flags",
      name: "GS",
    },
    label: "South Georgia and the South Sandwich Islands",
    value: "GS",
  },
  KR: {
    icon: {
      path: "flags",
      name: "KR",
    },
    label: "South Korea",
    value: "KR",
  },
  SS: {
    icon: {
      path: "flags",
      name: "SS",
    },
    label: "South Sudan",
    value: "SS",
  },
  ES: {
    icon: {
      path: "flags",
      name: "ES",
    },
    label: "Spain",
    value: "ES",
  },
  LK: {
    icon: {
      path: "flags",
      name: "LK",
    },
    label: "Sri Lanka",
    value: "LK",
  },
  PS: {
    icon: {
      path: "flags",
      name: "PS",
    },
    label: "State of Palestine",
    value: "PS",
  },
  SD: {
    icon: {
      path: "flags",
      name: "SD",
    },
    label: "Sudan",
    value: "SD",
  },
  SR: {
    icon: {
      path: "flags",
      name: "SR",
    },
    label: "Suriname",
    value: "SR",
  },
  SJ: {
    icon: {
      path: "flags",
      name: "SJ",
    },
    label: "Svalbard and Jan Mayen",
    value: "SJ",
  },
  SZ: {
    icon: {
      path: "flags",
      name: "SZ",
    },
    label: "Swaziland",
    value: "SZ",
  },
  SE: {
    icon: {
      path: "flags",
      name: "SE",
    },
    label: "Sweden",
    value: "SE",
  },
  CH: {
    icon: {
      path: "flags",
      name: "CH",
    },
    label: "Switzerland",
    value: "CH",
  },
  SY: {
    icon: {
      path: "flags",
      name: "SY",
    },
    label: "Syrian Arab Republic",
    value: "SY",
  },
  TW: {
    icon: {
      path: "flags",
      name: "TW",
    },
    label: "Taiwan",
    value: "TW",
  },
  TJ: {
    icon: {
      path: "flags",
      name: "TJ",
    },
    label: "Tajikistan",
    value: "TJ",
  },
  TZ: {
    icon: {
      path: "flags",
      name: "TZ",
    },
    label: "Tanzania",
    value: "TZ",
  },
  TH: {
    icon: {
      path: "flags",
      name: "TH",
    },
    label: "Thailand",
    value: "TH",
  },
  TL: {
    icon: {
      path: "flags",
      name: "TL",
    },
    label: "Timor-Leste",
    value: "TL",
  },
  TG: {
    icon: {
      path: "flags",
      name: "TG",
    },
    label: "Togo",
    value: "TG",
  },
  TK: {
    icon: {
      path: "flags",
      name: "TK",
    },
    label: "Tokelau",
    value: "TK",
  },
  TO: {
    icon: {
      path: "flags",
      name: "TO",
    },
    label: "Tonga",
    value: "TO",
  },
  TT: {
    icon: {
      path: "flags",
      name: "TT",
    },
    label: "Trinidad and Tobago",
    value: "TT",
  },
  TN: {
    icon: {
      path: "flags",
      name: "TN",
    },
    label: "Tunisia",
    value: "TN",
  },
  TR: {
    icon: {
      path: "flags",
      name: "TR",
    },
    label: "Turkey",
    value: "TR",
  },
  TM: {
    icon: {
      path: "flags",
      name: "TM",
    },
    label: "Turkmenistan",
    value: "TM",
  },
  TC: {
    icon: {
      path: "flags",
      name: "TC",
    },
    label: "Turks and Caicos Islands",
    value: "TC",
  },
  TV: {
    icon: {
      path: "flags",
      name: "TV",
    },
    label: "Tuvalu",
    value: "TV",
  },
  UG: {
    icon: {
      path: "flags",
      name: "UG",
    },
    label: "Uganda",
    value: "UG",
  },
  UA: {
    icon: {
      path: "flags",
      name: "UA",
    },
    label: "Ukraine",
    value: "UA",
  },
  AE: {
    icon: {
      path: "flags",
      name: "AE",
    },
    label: "United Arab Emirates",
    value: "AE",
  },
  GB: {
    icon: {
      path: "flags",
      name: "GB",
    },
    label: "United Kingdom",
    value: "GB",
  },
  UM: {
    icon: {
      path: "flags",
      name: "UM",
    },
    label: "United States Minor Outlying Islands",
    value: "UM",
  },
  US: {
    icon: {
      path: "flags",
      name: "US",
    },
    label: "United States of America",
    value: "US",
  },
  UY: {
    icon: {
      path: "flags",
      name: "UY",
    },
    label: "Uruguay",
    value: "UY",
  },
  UZ: {
    icon: {
      path: "flags",
      name: "UZ",
    },
    label: "Uzbekistan",
    value: "UZ",
  },
  VU: {
    icon: {
      path: "flags",
      name: "VU",
    },
    label: "Vanuatu",
    value: "VU",
  },
  VE: {
    icon: {
      path: "flags",
      name: "VE",
    },
    label: "Venezuela (Bolivarian Republic of)",
    value: "VE",
  },
  VN: {
    icon: {
      path: "flags",
      name: "VN",
    },
    label: "Vietnam",
    value: "VN",
  },
  VG: {
    icon: {
      path: "flags",
      name: "VG",
    },
    label: "Virgin Islands (British)",
    value: "VG",
  },
  VI: {
    icon: {
      path: "flags",
      name: "VI",
    },
    label: "Virgin Islands (U.S.)",
    value: "VI",
  },
  "GB:WLS": {
    icon: {
      path: "flags",
      name: "GB",
    },
    label: "Wales",
    value: "GB",
  },
  WF: {
    icon: {
      path: "flags",
      name: "WF",
    },
    label: "Wallis and Futuna",
    value: "WF",
  },
  EH: {
    icon: {
      path: "flags",
      name: "EH",
    },
    label: "Western Sahara",
    value: "EH",
  },
  YE: {
    icon: {
      path: "flags",
      name: "YE",
    },
    label: "Yemen",
    value: "YE",
  },
  ZM: {
    icon: {
      path: "flags",
      name: "ZM",
    },
    label: "Zambia",
    value: "ZM",
  },
  ZW: {
    icon: {
      path: "flags",
      name: "ZW",
    },
    label: "Zimbabwe",
    value: "ZW",
  },
};
</script>
