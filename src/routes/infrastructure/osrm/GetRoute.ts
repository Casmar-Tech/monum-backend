import axios from "axios";

export const getRoute = async (
  profile: string = "",
  coordinates: [number, number][]
) => {
  const baseURL = "http://osrm-backend:5000"; // Asume que OSRM está corriendo localmente en el puerto 5000
  const endpoint = `/route/v1/${profile}/${coordinates
    .map((coord) => coord.join(","))
    .join(";")}`;

  const params = {
    overview: "simplified",
  };

  try {
    const response = await axios.get(baseURL + endpoint, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching route:", error);
  }
};
