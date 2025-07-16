function interpolateColor(
  value: number,
  minValue: number,
  maxValue: number,
  startColor: number[],
  endColor: number[],
): number[] {
  const t = (maxValue - minValue) > 0 ? (value - minValue) / (maxValue - minValue) : 0;

  // interpolating R, G, B values
  const r = startColor[0] + t * (endColor[0] - startColor[0]);
  const g = startColor[1] + t * (endColor[1] - startColor[1]);
  const b = startColor[2] + t * (endColor[2] - startColor[2]);

  return [Math.round(r), Math.round(g), Math.round(b)];
}

function getGradientColor(value: number): {r: number, g: number, b: number} {
  const clampedValue = Math.max(0.0, Math.min(1.0, value));

  const GREEN = [0, 255, 0];
  const YELLOW = [255, 255, 0];
  const ORANGE = [255, 165, 0];
  const RED = [255, 0, 0];

  const YELLOW_THRESHOLD = 0.33;
  const ORANGE_THRESHOLD = 0.66;

  let r: number, g: number, b: number;

  if (clampedValue <= YELLOW_THRESHOLD) {
    [r, g, b] = interpolateColor(clampedValue, 0.0, YELLOW_THRESHOLD, GREEN, YELLOW);
  } else if (clampedValue <= ORANGE_THRESHOLD) {
    [r, g, b] = interpolateColor(clampedValue, YELLOW_THRESHOLD, ORANGE_THRESHOLD, YELLOW, ORANGE);
  } else {
    [r, g, b] = interpolateColor(clampedValue, ORANGE_THRESHOLD, 1.0, ORANGE, RED);
  }

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
  }
}

export function useGlobalUtils() {
  return {
    getGradientColor,
  };
}
