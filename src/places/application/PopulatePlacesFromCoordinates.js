const url = "https://places.googleapis.com/v1/places:searchNearby";
const apiKey = "AIzaSyApcrBgkoBmvB0RBeHYd4nAfIHQwngt1Q0"; // Asegúrate de proteger tu clave de API
const includedTypes = [
  "church",
  "airport",
  "aquarium",
  "art_gallery",
  "amusement_park",
  "bus_station",
  "courthouse",
  "embassy",
  "hindu_temple",
  "library",
  "local_government_office",
  "mosque",
  "movie_theater",
  "museum",
  "park",
  "stadium",
  "synagogue",
  // 'train_station',
  "tourist_attraction",
  "university",
  "zoo",
];
const smallPhotoMaxHeightPx = 200;
const smallPhotoMaxWidthPx = 400;
const standardPhotoMaxHeightPx = 600;
const standardPhotoMaxWidthPx = 1200;
const largePhotoMaxHeightPx = 4800;
const largePhotoMaxWidthPx = 4800;

async function getPhotos(photoName) {
  const photos = [];
  for (const size of ["small", "standard", "large"]) {
    const height =
      size === "small"
        ? smallPhotoMaxHeightPx
        : size === "standard"
        ? standardPhotoMaxHeightPx
        : largePhotoMaxHeightPx;
    const width =
      size === "small"
        ? smallPhotoMaxWidthPx
        : size === "standard"
        ? standardPhotoMaxWidthPx
        : largePhotoMaxWidthPx;
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${height}&maxWidthPx=${width}&key=${apiKey}`;
    const response = await fetch(url);
    const blob = await response.blob();
    photos.push({ blob, size });
  }
  return photos;
}

async function searchInCircle(center, radius) {
  const data = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: center[0],
          longitude: center[1],
        },
        radius: radius,
      },
    },
  };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "*",
      "Accept-Language": "en",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(url, options);
  const json = await response.json();
  return json.places;
}

async function main(coordinates, radius, maxResultCount, apiKey) {
  const maxResultsPerRequest = 20;
  const numberOfCircles = Math.ceil(maxResultCount / maxResultsPerRequest);
  const smallCircleRadius = radius / Math.sqrt(numberOfCircles);

  let places = [];
  let count = 0;

  // Este es un ejemplo básico de distribución de centros. Necesitarías ajustarlo para cubrir correctamente el área.
  for (let i = 0; i < Math.sqrt(numberOfCircles); i++) {
    for (let j = 0; j < Math.sqrt(numberOfCircles); j++) {
      // Calcular el centro de cada círculo pequeño
      const offsetLat = (smallCircleRadius / 111111) * i; // ~111111 metros por grado de latitud
      const offsetLng =
        (smallCircleRadius / (111111 * Math.cos(coordinates[0]))) * j; // Ajustar por coseno de la latitud para longitud

      const newCenter = [
        coordinates[0] + offsetLat,
        coordinates[1] + offsetLng,
      ];

      // Llamar a la función de búsqueda para este círculo pequeño
      const partialResults = await searchInCircle(
        newCenter,
        smallCircleRadius,
        apiKey
      );
      places = Array.from(new Set([...places, ...partialResults]));
      count += partialResults.length;

      // Verificar si ya alcanzamos el maxResultCount
      if (count >= maxResultCount) break;
    }
    if (count >= maxResultCount) break;
  }

  // Get the photos for each place
  for (const place of places) {
    place.photos = await Promise.all(
      place.photos?.map(async (photo) => {
        const photos = await getPhotos(photo.name);
        return { url: await getPhoto(photo.name), ...photo };
      })
    );
  }
}

main([41.98, 2.82], 20000, 20);
