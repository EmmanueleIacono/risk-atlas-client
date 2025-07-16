import { PointLocationInfo } from "../types/types";
import { useServerStore } from "../stores/useServerStore";

const { buildFloodHazardUrl } = useServerStore();

async function getFloodHazardScores(points: PointLocationInfo[]) {
  const full_url = buildFloodHazardUrl();
  const res = await fetch(full_url, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(points)
  });
  const scoreData: { id: number, score: number }[] = await res.json();

  return scoreData;
}

export function useHazardUtils() {
  return {
    getFloodHazardScores,
  };
}
