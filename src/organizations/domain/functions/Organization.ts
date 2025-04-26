import {
  IOrganization,
  IOrganizationTranslated,
} from "../../domain/interfaces/IOrganization.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

export function getTranslatedOrganization(
  organization: IOrganization,
  language: string
): IOrganizationTranslated {
  return {
    ...organization,
    id: organization?._id?.toString() || "",
    plan: {
      ...organization.plan,
      id: organization.plan?._id?.toString() || "",
      permissions: organization.plan.permissions.map((permission: any) => {
        return {
          ...permission,
          id: permission._id?.toString() || "",
        };
      }),
    },
    address: {
      coordinates: organization.address.coordinates,
      postalCode: organization.address.postalCode,
      street: organization.address.street
        ? getTranslation(organization.address.street, language)
        : undefined,
      city: organization.address.city
        ? getTranslation(organization.address.city, language)
        : "",
      province: organization.address.province
        ? getTranslation(organization.address.province, language)
        : undefined,
      country: organization.address.country
        ? getTranslation(organization.address.country, language)
        : "",
    },
  };
}
