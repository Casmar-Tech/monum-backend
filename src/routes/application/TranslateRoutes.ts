import "../../connection.js";
import { Languages } from "../../shared/Types.js";
import { translateStringDeepl } from "../../shared/translations/deepl";
import { translateStringGoogle } from "../../shared/translations/googleTranslation.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";

async function TranslateRoute(
  routeId: string,
  outputLanguage: Languages,
  forceUpdate = false,
  translationPlatform: "deepl" | "google" = "deepl"
) {
  let route = await MongoRouteModel.findById(routeId);
  if (!route) {
    throw new Error("Route not found");
  }
  try {
    const translateFunction =
      translationPlatform === "deepl"
        ? translateStringDeepl
        : translateStringGoogle;

    if (!route.title[outputLanguage] || forceUpdate) {
      const translatedTitle = await translateFunction(
        route.title?.en_US || (route.title && Object.values(route.title)[0]),
        outputLanguage
      );
      route.title = {
        ...route.title,
        [outputLanguage]: translatedTitle,
      };
    }

    if (!route.description[outputLanguage] || forceUpdate) {
      const translatedDescription = await translateFunction(
        route.description?.en_US ||
          (route.description && Object.values(route.description)[0]),
        outputLanguage
      );
      route.description = {
        ...route.description,
        [outputLanguage]: translatedDescription,
      };
    }

    await route.save();
    console.log(`Route ${routeId} translated`);
  } catch (error) {
    console.error(error);
  }
}

async function TranslateAllRoutes(
  outputLanguage: Languages,
  translationPlatform: "deepl" | "google" = "deepl"
) {
  const query = {
    description: { $exists: true },
    deleted: { $ne: true },
    $or: [
      { [`title.${outputLanguage}`]: { $exists: false } },
      { [`description.${outputLanguage}`]: { $exists: false } },
    ],
  };
  const routes = await MongoRouteModel.find(query);
  let index = 0;
  for (const route of routes) {
    index++;
    console.log(`Translating route ${index}/${routes.length}`);
    await TranslateRoute(route.id, outputLanguage, true, translationPlatform);
  }
  console.log("All routes translated!");
}

// TranslateAllRoutes("ca_ES", "google");
