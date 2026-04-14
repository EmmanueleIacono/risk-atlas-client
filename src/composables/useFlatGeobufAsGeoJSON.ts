import { geojson, type Feature } from "flatgeobuf"; // I only need "deserialize", but can't import it directly

async function convertFgbArrayBufferToGeoJSON(arrayBuffer: ArrayBuffer) {
  const features: Feature[] = [];

  // "deserialize" expects a UintArray (or URL/stream)
  const buffer = new Uint8Array(arrayBuffer);

  // "deserialize" returns an async iterator of IGeoJsonFeature objects
  for await (const feature of geojson.deserialize(buffer)) {
    // the yielded object already has the shape of a GeoJSON Feature
    features.push(feature as Feature);
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

async function fetchFgbAsGeoJSON(
  url: string,
  fetchOptions: RequestInit = {},
  retries: number = 3 // using default value to ensure backwards compatibility
) {
  const resp = await fetch(url, fetchOptions);

  if (resp.status === 503 && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return fetchFgbAsGeoJSON(url, fetchOptions, retries - 1);
  }

  if (!resp.ok) {
    throw new Error(`Failed to fetch FGB from ${url}: ${resp.status} ${resp.statusText}`);
  }

  const arrayBuffer = await resp.arrayBuffer();
  return convertFgbArrayBufferToGeoJSON(arrayBuffer);
}

export function useFlatGeoBufAsGeoJSON() {
  return {
    fetchFgbAsGeoJSON,
  };
}
