import axios from "axios";

interface TripOptions {
  steps?: boolean;
  geometries?: "polyline" | "polyline6" | "geojson";
  overview?: "simplified" | "full" | "false";
  annotations?: boolean;
}

// Function to get the optimized route
export const getTrip = async (
  profile: string,
  coordinates: [number, number][],
  options: TripOptions = {}
) => {
  const baseURL = "http://osrm-backend:5000"; // Asume que OSRM está corriendo localmente en el puerto 5000
  const endpoint = `/trip/v1/${profile}/${coordinates
    .map((coord) => coord.join(","))
    .join(";")}`;

  // Parámetros por defecto
  const defaultParams: TripOptions = {
    steps: false,
    geometries: "polyline",
    overview: "simplified",
    annotations: false,
  };

  const params = { ...defaultParams, ...options };

  try {
    const response = await axios.get(baseURL + endpoint, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching trip:", error);
  }
};
