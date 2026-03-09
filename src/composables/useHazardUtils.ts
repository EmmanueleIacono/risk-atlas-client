import { HazardType, HazardScore, PointLocationInfo } from "../types/types";
import { useServerStore } from "../stores/useServerStore";

const { buildFloodHazardUrl, buildLandslideHazardUrl, buildSeismicHazardUrl } = useServerStore();

function getHazardScoreUrl(type: HazardType): string {
  if (type === "flooding") return buildFloodHazardUrl();
  if (type === "landslide") return buildLandslideHazardUrl();
  return buildSeismicHazardUrl(); // could be wired better, this seems like a default
}

async function getHazardScores(
  type: HazardType,
  points: PointLocationInfo[]
): Promise<HazardScore[]> {
  const full_url = getHazardScoreUrl(type);
  const res = await fetch(full_url, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(points)
  });

  if (!res.ok) {
    throw new Error(`Hazard assessment failed (${type}): ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

export function useHazardUtils() {
  return {
    getHazardScores,
  };
}
