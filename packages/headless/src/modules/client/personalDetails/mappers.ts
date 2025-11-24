// ---internal
import { Client } from "../../session";
import { CustomField } from "../customFields";
import { ProfileField, useBrand, useI18n } from "../../";

// --- utils
import { map, find, get } from "lodash-es";

export function mapProfileFields(
  client: Client,
  fields: CustomField[]
): ProfileField[] {
  const { t } = useI18n();
  const { languages } = useBrand();

  return [
    {
      id: "firstName",
      code: "firstName",
      title: t("form.firstname.label"),
      value: client.firstname
    },
    {
      id: "lastName",
      code: "lastName",
      title: t("form.lastname.label"),
      value: client.lastname
    },
    {
      id: "publicName",
      code: "publicName",
      title: t("form.publicName.label"),
      value: client.public_name // change
    },
    {
      id: "language",
      code: "language",
      title: t("form.language.label"),
      value: get(
        find(languages.value, ["id", client.interface_language_id]),
        "language"
      ) // change
    },

    ...map(fields, (customField: CustomField) => {
      return {
        id: customField.id,
        code: customField.code,
        title: customField.name,
        value: find(client.customFields || [], ["field_id", customField.id])
          ?.value
      };
    })
  ];
}
