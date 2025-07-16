function computeCentroid(coordinates: {lon: number, lat: number}[]): {lon: number, lat: number} {
  if (coordinates.length === 0) return { lon: 0, lat: 0};

  let sumLon = 0;
  let sumLat = 0;

  for (const coord of coordinates) {
    sumLon += coord.lon;
    sumLat += coord.lat;
  }

  const meanLon = sumLon / coordinates.length;
  const meanLat = sumLat / coordinates.length;

  return {
    lon: meanLon,
    lat: meanLat,
  };
}

export function useGeoUtils() {
  return {
    computeCentroid,
  };
}
